import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { CreditCard, Loader2, Award, Medal, Crown, Gem, Coins } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Badge } from "./Badge";
import { NumericKeypad } from "./NumericKeypad";
import { formatCurrency, parseFormattedNumber } from "../helpers/numberUtils";
import { useTransactionMutation } from "../helpers/useTransactionMutation";
import { useLoyaltySettingsQuery } from "../helpers/useLoyaltyQueries";
import { processCardPayment } from "../helpers/paymentGateway";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./Dialog";
import styles from "./POSCheckout.module.css";
import { type InputType as TransactionInputType } from "../endpoints/transactions_POST.schema";

type CartItem = {
  productId: number;
  name: string;
  quantity: number;
  price: number;
};

type PaymentMethod = "card" | "points" | "hybrid";

interface POSCheckoutProps {
  isOpen: boolean;
  cart: CartItem[];
  total: number;
  customerId?: number;
  customerName?: string;
  customerPoints?: number;
  customerTierName?: string | null;
  customerTierColor?: string | null;
  customerTierIcon?: string | null;
  customerTierDiscount?: string | null;
  onComplete: () => void;
  onCancel: () => void;
}

export const POSCheckout = ({
  isOpen,
  cart,
  total,
  customerId,
  customerName,
  customerPoints = 0,
  customerTierName,
  customerTierColor,
  customerTierIcon,
  customerTierDiscount,
  onComplete,
  onCancel,
}: POSCheckoutProps) => {
  const getTierIcon = (iconName: string | null) => {
    if (!iconName) return <Award size={14} />;
    switch (iconName) {
      case 'medal': return <Medal size={14} />;
      case 'crown': return <Crown size={14} />;
      case 'gem': return <Gem size={14} />;
      case 'award':
      default: return <Award size={14} />;
    }
  };

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [pointsToUse, setPointsToUse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const transactionMutation = useTransactionMutation();
  const { data: loyaltySettings, isFetching: isLoadingSettings } = useLoyaltySettingsQuery();

  // Calculate discount from tier
  const discount = useMemo(() => {
    if (!customerTierDiscount) return 0;
    return total * parseFloat(customerTierDiscount);
  }, [total, customerTierDiscount]);

  const finalTotal = useMemo(() => total - discount, [total, discount]);

  // Get points conversion rate from loyalty settings
  const pointsPerDollar = useMemo(() => {
    if (!loyaltySettings) return 100; // Default fallback
    const setting = loyaltySettings.find(s => s.settingKey === "points_per_dollar");
    return setting ? parseFloat(setting.settingValue) : 100;
  }, [loyaltySettings]);

  const pointsRedemptionValue = useMemo(() => {
    if (!loyaltySettings) return 100; // Default fallback
    const setting = loyaltySettings.find(s => s.settingKey === "redemption_value");
    return setting ? parseFloat(setting.settingValue) : 100;
  }, [loyaltySettings]);

  // Calculate points needed for full payment
  const pointsNeeded = useMemo(() => {
    return Math.ceil(finalTotal * pointsRedemptionValue);
  }, [finalTotal, pointsRedemptionValue]);

  // Parse points input
  const pointsToUseNum = useMemo(() => {
    const parsed = parseInt(pointsToUse) || 0;
    return Math.min(parsed, customerPoints); // Can't use more than available
  }, [pointsToUse, customerPoints]);

  // Calculate point value in currency
  const pointsValue = useMemo(() => {
    return pointsToUseNum / pointsRedemptionValue;
  }, [pointsToUseNum, pointsRedemptionValue]);

  // Calculate remaining amount for card (in hybrid mode)
  const remainingForCard = useMemo(() => {
    return Math.max(0, finalTotal - pointsValue);
  }, [finalTotal, pointsValue]);

  const hasEnoughPoints = customerPoints >= pointsNeeded;

  const handleReset = () => {
    setPaymentMethod(null);
    setPointsToUse("");
    setIsProcessing(false);
    setError(null);
    setPaymentResult(null);
  };

  const handleCancel = () => {
    handleReset();
    onCancel();
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setError(null);
    setPaymentMethod(method);
    setPointsToUse("");

    // For points payment, pre-fill with exact amount needed
    if (method === "points") {
      setPointsToUse(pointsNeeded.toString());
    }
  };

  const isSubmitDisabled = useMemo(() => {
    if (isProcessing) return true;
    if (!customerId && paymentMethod !== "card") return true; // Points require customer
    
    if (paymentMethod === 'card') return finalTotal <= 0;
    if (paymentMethod === 'points') {
      return pointsToUseNum < pointsNeeded || pointsToUseNum > customerPoints;
    }
    if (paymentMethod === 'hybrid') {
      return pointsToUseNum <= 0 || remainingForCard <= 0 || pointsToUseNum > customerPoints;
    }
    return true;
  }, [isProcessing, paymentMethod, finalTotal, pointsToUseNum, pointsNeeded, customerPoints, remainingForCard, customerId]);

  const handleProcessPayment = async () => {
    if (!customerId && paymentMethod !== "card") {
      toast.error("Se requiere un cliente para pagos con puntos");
      return;
    }

    setIsProcessing(true);
    setError(null);

    console.log("Iniciando procesamiento de pago:", {
      paymentMethod,
      total,
      discount,
      finalTotal,
      pointsToUse: pointsToUseNum,
      pointsValue,
      remainingForCard,
      customerId,
      cartItems: cart.length
    });

    try {
      const payments: Array<{
        method: string;
        amount: number;
        pointsAmount?: number;
        cardTransactionId?: string;
      }> = [];

      // Process points payment (full)
      if (paymentMethod === "points") {
        console.log("Procesando pago completo con puntos:", pointsToUseNum);
        payments.push({
          method: "points",
          amount: finalTotal,
          pointsAmount: pointsToUseNum,
        });
      }

      // Process hybrid payment (points + card)
      if (paymentMethod === "hybrid") {
        console.log("Procesando pago híbrido - Puntos:", pointsToUseNum, "Tarjeta:", remainingForCard);
        
        // Process card payment first to ensure it's approved before redeeming points
        toast.info("Procesando pago con tarjeta...");
        
        const cardPaymentResult = await processCardPayment({
          amount: remainingForCard,
          description: `Alwon POS Sale (Hybrid) - ${cart.length} items`,
          orderId: `POS-${Date.now()}`,
          customer: {
            name: customerName || "Cliente POS",
            email: "customer@example.com"
          },
          metadata: {
            productCount: cart.length,
            productIds: cart.map(item => item.productId).join(','),
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
        
        payments.push({
          method: "hybrid",
          amount: finalTotal,
          pointsAmount: pointsToUseNum,
          cardTransactionId: cardPaymentResult.transactionId,
        });
      }

      // Process card payment (full)
      if (paymentMethod === "card") {
        console.log("Procesando pago completo con tarjeta:", finalTotal);
        toast.info("Procesando pago con tarjeta...");
        
        const cardPaymentResult = await processCardPayment({
          amount: finalTotal,
          description: `Alwon POS Sale - ${cart.length} items`,
          orderId: `POS-${Date.now()}`,
          customer: customerId ? {
            name: customerName || "Cliente POS",
            email: "customer@example.com"
          } : undefined,
          metadata: {
            productCount: cart.length,
            productIds: cart.map(item => item.productId).join(',')
          }
        });

        if (!cardPaymentResult.success) {
          console.error("Error en pago con tarjeta:", cardPaymentResult);
          throw new Error(cardPaymentResult.errorMessage || "Card payment failed");
        }

        console.log("Pago con tarjeta aprobado:", cardPaymentResult);
        toast.success("Pago con tarjeta aprobado.");
        payments.push({
          method: "card",
          amount: finalTotal,
          cardTransactionId: cardPaymentResult.transactionId,
        });
      }

      // Create transaction in database
      console.log("Creando transacción en base de datos...");
      toast.info("Registrando transacción...");
      
      await transactionMutation.mutateAsync({
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        payments: payments as TransactionInputType['payments'],
        customerId
      });

      console.log("Transacción completada exitosamente");
      
      let successMessage = "¡Venta completada exitosamente!";
      if (paymentMethod === "points") {
        successMessage += ` ${pointsToUseNum} puntos canjeados.`;
      } else if (paymentMethod === "hybrid") {
        successMessage += ` ${pointsToUseNum} puntos + ${formatCurrency(remainingForCard)} tarjeta.`;
      }

      setPaymentResult({
        success: true,
        message: successMessage,
      });

      toast.success("¡Venta completada exitosamente!");
      if (discount > 0) {
        toast.success(`Descuento aplicado: ${formatCurrency(discount)}`);
      }
      if (paymentMethod === "points" || paymentMethod === "hybrid") {
        toast.info(`Puntos canjeados: ${pointsToUseNum}`);
      }

      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (error) {
      console.error("Error en procesamiento de pago:", error);
      const errorMessage = error instanceof Error ? error.message : "Payment failed";
      setPaymentResult({
        success: false,
        message: errorMessage
      });
      setError(errorMessage);
      toast.error(`Error en el pago: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className={styles.checkoutDialog}>
        <DialogHeader>
          <DialogTitle>Procesar Pago</DialogTitle>
        </DialogHeader>

        {!paymentResult ? (
          <>
            <div className={styles.summary}>
              {customerTierName && (
                <div className={styles.tierInfo}>
                  <Badge 
                    variant="secondary" 
                    className={styles.tierBadge}
                    style={{ backgroundColor: customerTierColor || undefined }}
                  >
                    {getTierIcon(customerTierIcon || null)}
                    {customerTierName}
                  </Badge>
                  <span className={styles.customerName}>{customerName}</span>
                </div>
              )}
              
              {customerId && (
                <div className={styles.pointsBalance}>
                  <Coins size={20} />
                  <span>Puntos disponibles: <strong>{customerPoints.toLocaleString()}</strong></span>
                  <span className={styles.conversionRate}>
                    ({pointsRedemptionValue} puntos = {formatCurrency(1)})
                  </span>
                </div>
              )}
              
              <div className={styles.summaryRow}>
                <span>Subtotal:</span>
                <span>{formatCurrency(total)}</span>
              </div>
              
              {discount > 0 && (
                <div className={styles.summaryRow}>
                  <span>Descuento {customerTierName}:</span>
                  <span className={styles.success}>
                    -{formatCurrency(discount)}
                  </span>
                </div>
              )}
              
              <div className={styles.summaryRow}>
                <span>Total a pagar:</span>
                <strong>{formatCurrency(finalTotal)}</strong>
              </div>

              {customerId && (
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
                  onClick={() => handlePaymentMethodSelect("card")}
                  className={styles.methodButton}
                >
                  <CreditCard size={24} />
                  <span>Tarjeta / Wallet</span>
                  <span className={styles.methodSubtext}>BOLD Payment Gateway</span>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handlePaymentMethodSelect("points")}
                  disabled={!customerId || !hasEnoughPoints || isLoadingSettings}
                  className={styles.methodButton}
                >
                  <Coins size={24} />
                  <span>Puntos de Lealtad</span>
                  {!customerId ? (
                    <span className={styles.methodSubtext}>Requiere cliente</span>
                  ) : !hasEnoughPoints ? (
                    <span className={styles.methodError}>Puntos insuficientes</span>
                  ) : (
                    <span className={styles.methodSubtext}>{pointsNeeded.toLocaleString()} puntos</span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handlePaymentMethodSelect("hybrid")}
                  disabled={!customerId || customerPoints < 100 || isLoadingSettings}
                  className={styles.methodButton}
                >
                  <div className={styles.hybridIcons}>
                    <Coins size={20} />
                    <span>+</span>
                    <CreditCard size={20} />
                  </div>
                  <span>Pago Mixto</span>
                  {!customerId ? (
                    <span className={styles.methodSubtext}>Requiere cliente</span>
                  ) : customerPoints < 100 ? (
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
                        <span>{(customerPoints - pointsNeeded).toLocaleString()} puntos</span>
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
                        onSubmit={() => {}} // Not used in this flow
                        maxLength={8}
                      />
                      <div className={styles.pointsHint}>
                        Máximo: {customerPoints.toLocaleString()} puntos disponibles
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
                          <span>{(customerPoints - pointsToUseNum).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {error && <p className={styles.error}>{error}</p>}

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
  );
};