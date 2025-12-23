import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useDebounce } from 'use-debounce';
import { toast } from 'sonner';
import { CreditCard, Loader2, Coins } from 'lucide-react';

import { useKioskConfig } from '../helpers/kioskConfig';

import { useKioskProductsQuery } from '../helpers/useKioskProductsQuery';
import { useKioskTransactionMutation } from '../helpers/useKioskTransactionMutation';
import { useLoyaltySettingsQuery } from '../helpers/useLoyaltyQueries';
import { useCustomerTiersQuery } from '../helpers/useLoyaltyTiersQueries';
import { processCardPayment } from '../helpers/paymentGateway';
import { getProductByBarcode } from '../endpoints/products/by-barcode_GET.schema';

import { type Selectable } from 'kysely';
import { type Products, PaymentMethod } from '../helpers/schema';
import { type OutputType as CustomersOutput } from '../endpoints/customers_GET.schema';
import { type InputType as KioskTransactionInput } from '../endpoints/kiosk/transactions_POST.schema';

import { Button } from '../components/ui/Button';
import { PinVerificationDialog } from '../components/ui/PinVerificationDialog';
import { KioskWelcomeBanner } from '../components/Kiosk/Kiosk WelcomeBanner';
import { KioskHeader } from '../components/Kiosk/KioskHeader';
import { KioskBanner } from '../components/Kiosk/KioskBanner';
import { KioskCategoryCircles } from '../components/Kiosk/KioskCategoryCircles';
import { KioskCartModal } from '../components/Kiosk/KioskCartModal';
import { KioskFiltersPanel } from '../components/Kiosk/KioskFiltersPanel';
import { KioskProductGrid } from '../components/Kiosk/KioskProductGrid';
import { NumericKeypad } from '../components/ui/NumericKeypad';
import { type CustomerTier } from '../components/ui/CustomerTierCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/Dialog';
import { formatCurrency } from '../helpers/numberUtils';

import styles from './kiosk.module.css';

const IDLE_TIMEOUT_MS = 2 * 60 * 1000;

type ProductWithSupplier = Selectable<Products> & {
  supplier: Selectable<import("../helpers/schema").Suppliers> | null;
};
type CustomerWithTier = CustomersOutput[number];
type CartItem = ProductWithSupplier & { quantity: number };
type KioskPaymentMethod = 'card' | 'points' | 'hybrid';

export default function KioskPage() {
  // Kiosk configuration
  const kioskConfig = useKioskConfig();
  const KIOSK_LOCATION_ID = kioskConfig.locationId;

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState<'in-stock' | 'all'>('in-stock');
  const [selectedCategoryCircle, setSelectedCategoryCircle] = useState<string | null>(null);

  // UI state
  const [showCartModal, setShowCartModal] = useState(false);
  const [showIdleDialog, setShowIdleDialog] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);

  // Customer state
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithTier | null>(null);
  const [pendingCustomer, setPendingCustomer] = useState<CustomerWithTier | null>(null);
  const [showPinDialog, setShowPinDialog] = useState(false);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<KioskPaymentMethod | null>(null);
  const [pointsToUse, setPointsToUse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Timers
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoResetIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-reset countdown state
  const [autoResetCountdown, setAutoResetCountdown] = useState<number>(60);

  // Barcode scanner state
  const [isScanning, setIsScanning] = useState(false);
  const barcodeBufferRef = useRef<string>('');
  const lastKeystrokeRef = useRef<number>(0);

  // Data fetching hooks
  const { data: products, isFetching: isFetchingProducts, error: productsError } = useKioskProductsQuery({
    locationId: KIOSK_LOCATION_ID,
    search: debouncedSearchTerm,
  });
  const { data: loyaltySettings, isFetching: isLoadingSettings } = useLoyaltySettingsQuery();
  const { data: customerTiers } = useCustomerTiersQuery();
  const kioskTransactionMutation = useKioskTransactionMutation();

  // Basic derived useMemos
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + Number(item.price) * item.quantity, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const categories = useMemo(() => {
    if (!products) return [];
    const categoryMap = new Map<string, number>();
    products.forEach(product => {
      if (product.stockQuantity > 0) {
        const category = product.category || 'Sin Categoría';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      }
    });
    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let filtered = products.filter(p =>
      availabilityFilter === 'in-stock' ? p.stockQuantity > 0 : true
    );

    if (selectedCategoryCircle && selectedCategoryCircle !== 'Todas') {
      filtered = filtered.filter(p => p.category === selectedCategoryCircle);
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(p => selectedCategories.includes(p.category || 'Sin Categoría'));
    }

    return filtered;
  }, [products, selectedCategories, selectedCategoryCircle, availabilityFilter]);

  const currentTier = useMemo((): CustomerTier | null => {
    if (!selectedCustomer || !customerTiers) return null;
    const tier = customerTiers.find(t => t.id === selectedCustomer.tierId);
    return tier ? { ...tier, discountPercentage: Number(tier.discountPercentage), pointsMultiplier: Number(tier.pointsMultiplier) } : null;
  }, [selectedCustomer, customerTiers]);

  const discount = useMemo(() => {
    if (!currentTier) return 0;
    return cartTotal * currentTier.discountPercentage;
  }, [cartTotal, currentTier]);

  const finalTotal = useMemo(() => cartTotal - discount, [cartTotal, discount]);

  const pointsPerDollar = useMemo(() => {
    if (!loyaltySettings) return 100;
    const setting = loyaltySettings.find(s => s.settingKey === 'points_per_dollar');
    return setting ? parseFloat(setting.settingValue) : 100;
  }, [loyaltySettings]);

  const pointsRedemptionValue = useMemo(() => {
    if (!loyaltySettings) return 100;
    const setting = loyaltySettings.find(s => s.settingKey === 'redemption_value');
    return setting ? parseFloat(setting.settingValue) : 100;
  }, [loyaltySettings]);

  const pointsNeeded = useMemo(() => {
    return Math.ceil(finalTotal * pointsRedemptionValue);
  }, [finalTotal, pointsRedemptionValue]);

  const pointsToUseNum = useMemo(() => {
    const parsed = parseInt(pointsToUse) || 0;
    return Math.min(parsed, selectedCustomer?.totalPoints || 0);
  }, [pointsToUse, selectedCustomer]);

  const pointsValue = useMemo(() => {
    return pointsToUseNum / pointsRedemptionValue;
  }, [pointsToUseNum, pointsRedemptionValue]);

  const remainingForCard = useMemo(() => {
    return Math.max(0, finalTotal - pointsValue);
  }, [finalTotal, pointsValue]);

  const hasEnoughPoints = selectedCustomer && (selectedCustomer.totalPoints ?? 0) >= pointsNeeded;

  const isSubmitDisabled = useMemo(() => {
    if (isProcessing) return true;
    if (!selectedCustomer && paymentMethod !== 'card') return true;

    if (paymentMethod === 'card') return finalTotal <= 0;
    if (paymentMethod === 'points') {
      return pointsToUseNum < pointsNeeded || pointsToUseNum > (selectedCustomer?.totalPoints || 0);
    }
    if (paymentMethod === 'hybrid') {
      return pointsToUseNum <= 0 || remainingForCard <= 0 || pointsToUseNum > (selectedCustomer?.totalPoints || 0);
    }
    return true;
  }, [isProcessing, paymentMethod, finalTotal, pointsToUseNum, pointsNeeded, selectedCustomer, remainingForCard]);

  // Core callbacks
  const resetKiosk = useCallback(() => {
    console.log("🔄 RESET KIOSK - Clearing all state:", {
      cartItems: cart.length,
      cartValue: cartTotal,
      hasCustomer: !!selectedCustomer,
      customerName: selectedCustomer?.name || 'none',
      searchTerm: searchTerm || 'empty',
      selectedCategories: selectedCategories.length,
    });
    setCart([]);
    setSearchTerm('');
    setSelectedCategories([]);
    setAvailabilityFilter('in-stock');
    setSelectedCategoryCircle(null);
    setShowCartModal(false);
    setShowCheckoutDialog(false);
    setSelectedCustomer(null);
    setPendingCustomer(null);
    setShowPinDialog(false);
    setShowWelcomeBanner(false);
    setPaymentMethod(null);
    setPointsToUse('');
    setIsProcessing(false);
    setPaymentResult(null);
    setIsScanning(false);
    barcodeBufferRef.current = '';
    lastKeystrokeRef.current = 0;
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  }, [cart.length, cartTotal, selectedCustomer, searchTerm, selectedCategories.length]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      console.log("⏱️  Idle timer reset - starting new 2-minute countdown");
    }
    idleTimerRef.current = setTimeout(() => {
      console.log("⚠️  IDLE TIMEOUT REACHED - Current state:", {
        cartItems: cart.length,
        cartValue: cart.reduce((total, item) => total + Number(item.price) * item.quantity, 0),
        hasCustomer: !!selectedCustomer,
        customerName: selectedCustomer?.name || 'none',
        timestamp: new Date().toISOString(),
      });
      console.log("📋 Cart contents:", cart.map(item => ({ name: item.name, qty: item.quantity, price: item.price })));
      setShowIdleDialog(true);
    }, IDLE_TIMEOUT_MS);
  }, [cart, selectedCustomer]);

  const handleUserActivity = useCallback(() => {
    console.log("👆 User activity detected - resetting idle timer");
    resetIdleTimer();
    if (showIdleDialog) {
      console.log("✅ User dismissed idle dialog - continuing session");
      setShowIdleDialog(false);
    }
  }, [resetIdleTimer, showIdleDialog]);

  const addToCart = useCallback((product: ProductWithSupplier) => {
    console.log("🛒 Adding to cart:", { product: product.name, currentCartSize: cart.length });
    handleUserActivity();
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stockQuantity) {
          return prevCart.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          toast.warning(`No hay más stock para ${product.name}.`);
          return prevCart;
        }
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  }, [cart.length, handleUserActivity]);

  const handleCustomerFound = useCallback((customer: CustomerWithTier) => {
    handleUserActivity();
    setPendingCustomer(customer);
    setShowPinDialog(true);
  }, [handleUserActivity]);

  const handleClearCustomer = useCallback(() => {
    console.log("👤 Customer cleared:", selectedCustomer?.name || 'unknown');
    handleUserActivity();
    setSelectedCustomer(null);
  }, [selectedCustomer, handleUserActivity]);

  const handlePinVerified = useCallback(() => {
    if (pendingCustomer) {
      setSelectedCustomer(pendingCustomer);
      setShowWelcomeBanner(true);
    }
    setShowPinDialog(false);
    setPendingCustomer(null);
  }, [pendingCustomer]);

  const handleCheckoutClick = useCallback(() => {
    handleUserActivity();
    if (cart.length === 0) {
      toast.error("El carrito está vacío.");
      return;
    }
    setShowCartModal(false);
    setShowCheckoutDialog(true);
  }, [cart.length, handleUserActivity]);

  const handlePaymentMethodSelect = useCallback((method: KioskPaymentMethod) => {
    setPaymentMethod(method);
    setPointsToUse('');

    if (method === 'points') {
      setPointsToUse(pointsNeeded.toString());
    }
  }, [pointsNeeded]);

  const handleProcessPayment = useCallback(async () => {
    if (!selectedCustomer && paymentMethod !== "card") {
      toast.error("Se requiere un cliente para pagos con puntos");
      return;
    }

    setIsProcessing(true);

    console.log("Iniciando procesamiento de pago:", {
      paymentMethod,
      total: cartTotal,
      discount,
      finalTotal,
      pointsToUse: pointsToUseNum,
      pointsValue,
      remainingForCard,
      customerId: selectedCustomer?.id,
      cartItems: cart.length
    });

    try {
      let finalPaymentMethod: PaymentMethod = 'card';
      let cardTransactionId: string | undefined;

      // Process points payment (full)
      if (paymentMethod === 'points') {
        console.log("Procesando pago completo con puntos:", pointsToUseNum);
        finalPaymentMethod = 'points';
      }

      // Process hybrid payment (points + card)
      if (paymentMethod === 'hybrid') {
        console.log("Procesando pago híbrido - Puntos:", pointsToUseNum, "Tarjeta:", remainingForCard);

        toast.info("Procesando pago con tarjeta...");

        const cardPaymentResult = await processCardPayment({
          amount: remainingForCard,
          description: `Alwon Kiosk Sale (Hybrid) - ${cart.length} items`,
          orderId: `KIOSK-${Date.now()}`,
          customer: {
            name: selectedCustomer?.firstName || selectedCustomer?.name || "Cliente Kiosk",
            email: "customer@example.com"
          },
          metadata: {
            productCount: cart.length,
            productIds: cart.map(item => item.id).join(','),
            paymentType: 'hybrid',
            pointsUsed: pointsToUseNum
          }
        });

        if (!cardPaymentResult.success) {
          console.error("Error en pago con tarjeta:", cardPaymentResult);
          throw new Error(cardPaymentResult.errorMessage || "Card payment failed");
        }

        console.log("Pago con tarjeta aprobado:", cardPaymentResult);
        toast.success("Pago con tarjeta aprobado.");

        finalPaymentMethod = 'hybrid';
        cardTransactionId = cardPaymentResult.transactionId;
      }

      // Process card payment (full)
      if (paymentMethod === 'card') {
        console.log("Procesando pago completo con tarjeta:", finalTotal);
        toast.info("Procesando pago con tarjeta...");

        const cardPaymentResult = await processCardPayment({
          amount: finalTotal,
          description: `Alwon Kiosk Sale - ${cart.length} items`,
          orderId: `KIOSK-${Date.now()}`,
          customer: selectedCustomer ? {
            name: selectedCustomer.firstName || selectedCustomer.name,
            email: "customer@example.com"
          } : undefined,
          metadata: {
            productCount: cart.length,
            productIds: cart.map(item => item.id).join(',')
          }
        });

        if (!cardPaymentResult.success) {
          console.error("Error en pago con tarjeta:", cardPaymentResult);
          throw new Error(cardPaymentResult.errorMessage || "Card payment failed");
        }

        console.log("Pago con tarjeta aprobado:", cardPaymentResult);
        toast.success("Pago con tarjeta aprobado.");
        cardTransactionId = cardPaymentResult.transactionId;
      }

      // Create transaction in database
      console.log("Creando transacción en base de datos...");
      toast.info("Registrando transacción...");

      const transactionPayload: KioskTransactionInput = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        paymentMethod: finalPaymentMethod,
        customerId: selectedCustomer?.id,
      };

      await kioskTransactionMutation.mutateAsync({
        transaction: transactionPayload,
        locationId: KIOSK_LOCATION_ID,
      });

      console.log("Transacción completada exitosamente");

      let successMessage = "¡Compra completada exitosamente!";
      if (paymentMethod === "points") {
        successMessage += ` ${pointsToUseNum} puntos canjeados.`;
      } else if (paymentMethod === "hybrid") {
        successMessage += ` ${pointsToUseNum} puntos + ${formatCurrency(remainingForCard)} tarjeta.`;
      }

      setPaymentResult({
        success: true,
        message: successMessage,
      });

      toast.success("¡Compra completada exitosamente!");
      if (discount > 0) {
        toast.success(`Descuento aplicado: ${formatCurrency(discount)}`);
      }
      if (paymentMethod === "points" || paymentMethod === "hybrid") {
        toast.info(`Puntos canjeados: ${pointsToUseNum}`);
      }

      setTimeout(() => {
        console.log("💳 Payment complete - executing auto-reset");
        resetKiosk();
      }, 5000);

    } catch (error) {
      console.error("Error en procesamiento de pago:", error);
      const errorMessage = error instanceof Error ? error.message : "Payment failed";
      setPaymentResult({
        success: false,
        message: errorMessage
      });
      toast.error(`Error en el pago: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedCustomer, paymentMethod, cartTotal, discount, finalTotal, pointsToUseNum, pointsValue, remainingForCard, cart, kioskTransactionMutation, resetKiosk]);

  const handleToggleCategory = useCallback((category: string) => {
    handleUserActivity();
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  }, [handleUserActivity]);

  const handleClearFilters = useCallback(() => {
    handleUserActivity();
    setSelectedCategories([]);
    setAvailabilityFilter('all');
  }, [handleUserActivity]);

  // Effects
  // Facial Recognition Integration
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      try {
        const { type, customerId } = event.data;
        if (type !== 'FACIAL_RECOGNITION') return;
        if (typeof customerId !== 'number' || isNaN(customerId)) return;

        console.log(`Facial recognition detected customer ID: ${customerId}`);
        const response = await fetch(`/_api/customers?search=${customerId}`);
        if (!response.ok) throw new Error('Failed to fetch customer');

        const customers: CustomerWithTier[] = await response.json();
        const customer = customers.find(c => c.id === customerId);

        if (!customer) {
          toast.error('Cliente no encontrado en el sistema.');
          return;
        }

        setPendingCustomer(customer);
        setShowPinDialog(true);

        toast.success(`¡Bienvenido, ${customer.firstName || customer.name}! 👋`);
      } catch (error) {
        console.error('Error processing facial recognition:', error);
        toast.error('Error al cargar el perfil del cliente.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Initial idle timer setup
  useEffect(() => {
    console.log("🚀 Kiosk initialized - Starting idle timer");
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
      if (autoResetIntervalRef.current) clearInterval(autoResetIntervalRef.current);
    };
  }, [resetIdleTimer]);

  // Auto-reset countdown when idle dialog appears
  useEffect(() => {
    if (showIdleDialog) {
      console.log("Starting auto-reset countdown (60 seconds)");
      setAutoResetCountdown(60);

      autoResetIntervalRef.current = setInterval(() => {
        setAutoResetCountdown(prev => {
          if (prev <= 1) {
            if (autoResetIntervalRef.current) clearInterval(autoResetIntervalRef.current);
            if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
            console.log("⏰ AUTO-RESET COUNTDOWN COMPLETE - Forcing kiosk reset");
            setShowIdleDialog(false);
            resetKiosk();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (autoResetIntervalRef.current) clearInterval(autoResetIntervalRef.current);
      if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
      setAutoResetCountdown(60);
    }

    return () => {
      if (autoResetIntervalRef.current) clearInterval(autoResetIntervalRef.current);
      if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
    };
  }, [showIdleDialog, resetKiosk]);

  // Barcode Scanner Integration
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        console.log("🔤 Ignoring keypress - user is typing in input field");
        return;
      }

      const now = Date.now();
      const timeSinceLastKey = now - lastKeystrokeRef.current;

      // Enter key - process barcode
      if (event.key === 'Enter') {
        if (barcodeBufferRef.current.length > 0) {
          console.log("📦 Barcode detected:", barcodeBufferRef.current);
          setIsScanning(true);

          try {
            const product = await getProductByBarcode({
              barcode: barcodeBufferRef.current,
              locationId: KIOSK_LOCATION_ID,
            });

            console.log("✅ Product found by barcode:", {
              name: product.name,
              sku: product.sku,
              stock: product.stockQuantity,
              barcode: product.barcode,
            });

            // Add to cart
            addToCart(product as ProductWithSupplier);
            toast.success(`Producto agregado: ${product.name}`);

          } catch (error) {
            console.error("❌ Barcode scan error:", error);
            toast.error(`Producto no encontrado: ${barcodeBufferRef.current}`);
          } finally {
            setIsScanning(false);
            barcodeBufferRef.current = '';
            lastKeystrokeRef.current = 0;
          }
        }
        return;
      }

      // Only accumulate numbers and letters (typical barcode characters)
      if (/^[a-zA-Z0-9]$/.test(event.key)) {
        // Reset buffer if too much time has passed (not a scanner)
        if (timeSinceLastKey > 100 && barcodeBufferRef.current.length > 0) {
          console.log("⏱️  Timeout between keystrokes - resetting buffer");
          barcodeBufferRef.current = '';
        }

        barcodeBufferRef.current += event.key;
        lastKeystrokeRef.current = now;
        console.log("🔢 Barcode buffer:", barcodeBufferRef.current, `(${timeSinceLastKey}ms since last key)`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addToCart]);

  return (
    <>
      <Helmet>
        <title>Alwon Kiosko</title>
        <meta name="description" content="Kiosko de auto-servicio Alwon." />
      </Helmet>

      {selectedCustomer && currentTier && (
        <KioskWelcomeBanner
          customerName={selectedCustomer.firstName || selectedCustomer.name}
          tierName={currentTier.name}
          tierIcon={currentTier.icon}
          tierColor={currentTier.color}
          currentPoints={selectedCustomer.totalPoints || 0}
          isVisible={showWelcomeBanner}
          onClose={() => setShowWelcomeBanner(false)}
        />
      )}

      <div
        className={`${styles.kioskContainer} ${showWelcomeBanner ? styles.withBanner : ''}`}
        onClick={handleUserActivity}
        onKeyDown={handleUserActivity}
        role="presentation"
      >
        <KioskHeader
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCustomer={selectedCustomer}
          onCustomerFound={handleCustomerFound}
          onClearCustomer={handleClearCustomer}
          cartItemCount={cartItemCount}
          onCartClick={() => setShowCartModal(true)}
        />

        <KioskBanner onCTAClick={() => setSearchTerm('')} />

        <KioskCategoryCircles
          categories={categories}
          selectedCategory={selectedCategoryCircle}
          onSelectCategory={(category) => {
            handleUserActivity();
            setSelectedCategoryCircle(category);
            setSelectedCategories([]);
          }}
        />

        <div className={styles.mainContent}>
          {isScanning && (
            <div className={styles.scanningIndicator}>
              <Loader2 className={styles.scanningIcon} size={24} />
              <span>Escaneando código...</span>
            </div>
          )}

          <aside className={styles.sidebar}>
            <KioskFiltersPanel
              categories={categories}
              selectedCategories={selectedCategories}
              onToggleCategory={handleToggleCategory}
              onClearFilters={handleClearFilters}
              availabilityFilter={availabilityFilter}
              onAvailabilityChange={(filter) => {
                handleUserActivity();
                setAvailabilityFilter(filter);
              }}
            />
          </aside>

          <main className={styles.productArea}>
            <KioskProductGrid
              products={filteredProducts}
              isFetching={isFetchingProducts}
              error={productsError}
              onAddToCart={addToCart}
              locationId={KIOSK_LOCATION_ID}
            />
          </main>
        </div>
      </div>

      {/* Cart Modal */}
      <KioskCartModal
        isOpen={showCartModal}
        onClose={() => {
          handleUserActivity();
          setShowCartModal(false);
        }}
        cart={cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price),
        }))}
        total={cartTotal}
        onCheckout={handleCheckoutClick}
        onClearCart={() => {
          handleUserActivity();
          setCart([]);
        }}
      />

      {/* Checkout Dialog */}
      <Dialog open={showCheckoutDialog} onOpenChange={(open) => !open && !isProcessing && setShowCheckoutDialog(false)}>
        <DialogContent className={styles.checkoutDialog}>
          <DialogHeader>
            <DialogTitle className={styles.checkoutTitle}>Procesar Pago</DialogTitle>
          </DialogHeader>

          {!paymentResult ? (
            <>
              <div className={styles.summary}>
                {currentTier && (
                  <div className={styles.tierInfo}>
                    <span className={styles.tierBadge} style={{ backgroundColor: currentTier.color || undefined }}>
                      {currentTier.name}
                    </span>
                    <span className={styles.customerName}>{selectedCustomer?.firstName || selectedCustomer?.name}</span>
                  </div>
                )}

                {selectedCustomer && (
                  <div className={styles.pointsBalance}>
                    <Coins size={20} />
                    <span>Puntos disponibles: <strong>{selectedCustomer.totalPoints?.toLocaleString()}</strong></span>
                    <span className={styles.conversionRate}>
                      ({pointsRedemptionValue} puntos = {formatCurrency(1)})
                    </span>
                  </div>
                )}

                <div className={styles.summaryRow}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>

                {discount > 0 && (
                  <div className={styles.summaryRow}>
                    <span>Descuento {currentTier?.name}:</span>
                    <span className={styles.success}>
                      -{formatCurrency(discount)}
                    </span>
                  </div>
                )}

                <div className={styles.summaryRow}>
                  <span>Total a pagar:</span>
                  <strong>{formatCurrency(finalTotal)}</strong>
                </div>

                {selectedCustomer && (
                  <div className={styles.pointsInfo}>
                    <span>Puntos necesarios: {pointsNeeded.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {!paymentMethod ? (
                <div className={styles.paymentMethodSelection}>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handlePaymentMethodSelect('card')}
                    className={styles.methodButton}
                  >
                    <CreditCard size={24} />
                    <span>Tarjeta / Wallet</span>
                    <span className={styles.methodSubtext}>BOLD Payment Gateway</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handlePaymentMethodSelect('points')}
                    disabled={!selectedCustomer || !hasEnoughPoints || isLoadingSettings}
                    className={styles.methodButton}
                  >
                    <Coins size={24} />
                    <span>Puntos de Lealtad</span>
                    {!selectedCustomer ? (
                      <span className={styles.methodSubtext}>Requiere identificarse</span>
                    ) : !hasEnoughPoints ? (
                      <span className={styles.methodError}>Puntos insuficientes</span>
                    ) : (
                      <span className={styles.methodSubtext}>{pointsNeeded.toLocaleString()} puntos</span>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handlePaymentMethodSelect('hybrid')}
                    disabled={!selectedCustomer || (selectedCustomer?.totalPoints || 0) < 100 || isLoadingSettings}
                    className={styles.methodButton}
                  >
                    <div className={styles.hybridIcons}>
                      <Coins size={20} />
                      <span>+</span>
                      <CreditCard size={20} />
                    </div>
                    <span>Pago Mixto</span>
                    {!selectedCustomer ? (
                      <span className={styles.methodSubtext}>Requiere identificarse</span>
                    ) : (selectedCustomer?.totalPoints || 0) < 100 ? (
                      <span className={styles.methodError}>Mínimo 100 puntos</span>
                    ) : (
                      <span className={styles.methodSubtext}>Puntos + Tarjeta</span>
                    )}
                  </Button>
                </div>
              ) : (
                <div className={styles.detailsContainer}>
                  {paymentMethod === 'card' && (
                    <div className={styles.cardPaymentInfo}>
                      <CreditCard size={48} className={styles.paymentIcon} />
                      <p className={styles.cardMessage}>
                        El total de <strong>{formatCurrency(finalTotal)}</strong> se cobrará a la tarjeta o wallet digital.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'points' && (
                    <div className={styles.pointsPaymentInfo}>
                      <Coins size={48} className={styles.paymentIcon} />
                      <div className={styles.paymentSummary}>
                        <div className={styles.row}>
                          <span>Puntos a canjear:</span>
                          <span className={styles.highlight}>{pointsNeeded.toLocaleString()}</span>
                        </div>
                        <div className={styles.row}>
                          <span>Saldo después:</span>
                          <span>{((selectedCustomer?.totalPoints || 0) - pointsNeeded).toLocaleString()} puntos</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'hybrid' && (
                    <div className={styles.hybridPaymentInfo}>
                      <div className={styles.keypadSection}>
                        <label>¿Cuántos puntos deseas usar?</label>
                        <NumericKeypad
                          value={pointsToUse}
                          onChange={setPointsToUse}
                          onSubmit={() => { }}
                          maxLength={8}
                        />
                        <div className={styles.pointsHint}>
                          Máximo: {selectedCustomer?.totalPoints?.toLocaleString()} puntos disponibles
                        </div>
                      </div>

                      {pointsToUseNum > 0 && (
                        <div className={styles.paymentSummary}>
                          <div className={styles.row}>
                            <span>Puntos a usar:</span>
                            <span className={styles.highlight}>{pointsToUseNum.toLocaleString()}</span>
                          </div>
                          <div className={styles.row}>
                            <span>Valor en dinero:</span>
                            <span className={styles.success}>{formatCurrency(pointsValue)}</span>
                          </div>
                          <div className={styles.row}>
                            <span>Pago con tarjeta:</span>
                            <span>{formatCurrency(remainingForCard)}</span>
                          </div>
                          <div className={styles.row}>
                            <span>Puntos restantes:</span>
                            <span>{((selectedCustomer?.totalPoints || 0) - pointsToUseNum).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={styles.actions}>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setPaymentMethod(null)}
                      disabled={isProcessing}
                    >
                      Volver
                    </Button>
                    <Button
                      size="lg"
                      onClick={handleProcessPayment}
                      disabled={isSubmitDisabled}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className={styles.spinner} size={20} />
                          Procesando...
                        </>
                      ) : (
                        "Confirmar Pago"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={styles.result}>
              <div className={paymentResult.success ? styles.successIcon : styles.errorIcon}>
                {paymentResult.success ? "✅" : "❌"}
              </div>
              <h3>{paymentResult.message}</h3>
              {!paymentResult.success && (
                <Button size="lg" onClick={() => setPaymentResult(null)}>
                  Reintentar
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PIN Verification Dialog */}
      {pendingCustomer && (
        <PinVerificationDialog
          isOpen={showPinDialog}
          customerName={pendingCustomer.name}
          customerId={pendingCustomer.id}
          onVerified={handlePinVerified}
          onCancel={() => {
            setShowPinDialog(false);
            setPendingCustomer(null);
          }}
        />
      )}

      {/* Idle Dialog */}
      <Dialog open={showIdleDialog} onOpenChange={setShowIdleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Sigues ahí?</DialogTitle>
            <DialogDescription>
              Se reiniciará automáticamente en <strong className={styles.countdown}>{autoResetCountdown}</strong> {autoResetCountdown === 1 ? 'segundo' : 'segundos'}...
            </DialogDescription>
          </DialogHeader>
          <div className={styles.idleDialogActions}>
            <Button size="lg" onClick={() => {
              console.log("🔔 User clicked 'Continuar Compra' - Cancelling auto-reset", {
                cartItems: cart.length,
                hasCustomer: !!selectedCustomer,
              });
              if (autoResetIntervalRef.current) clearInterval(autoResetIntervalRef.current);
              if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
              setShowIdleDialog(false);
              resetIdleTimer();
            }}>
              Continuar Compra
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}