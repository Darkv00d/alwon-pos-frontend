import React from 'react';
import { ShoppingCart, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../helpers/numberUtils';
import styles from '../ui/KioskCartModal.module.css';

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface KioskCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  onCheckout: () => void;
  onClearCart: () => void;
  className?: string;
}

export const KioskCartModal = ({
  isOpen,
  onClose,
  cart,
  total,
  onCheckout,
  onClearCart,
  className,
}: KioskCartModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${styles.dialogContent} ${className || ''}`}>
        <DialogHeader>
          <DialogTitle className={styles.title}>
            <ShoppingCart size={24} />
            <span>Tu Carrito</span>
          </DialogTitle>
        </DialogHeader>

        <div className={styles.cartContent}>
          {cart.length === 0 ? (
            <div className={styles.emptyState}>
              <ShoppingCart className={styles.emptyIcon} />
              <div>
                <p>Tu carrito está vacío</p>
                <span>Agrega productos para continuar</span>
              </div>
            </div>
          ) : (
            <ul className={styles.cartList}>
              {cart.map((item) => (
                <li key={item.id} className={styles.cartItem}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemQuantity}>
                      {item.quantity} x {formatCurrency(item.price)}
                    </span>
                  </div>
                  <span className={styles.itemTotal}>
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <DialogFooter className={styles.footer}>
            <div className={styles.totalContainer}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalAmount}>{formatCurrency(total)}</span>
            </div>
            <Button className={styles.checkoutButton} onClick={onCheckout}>
              PAGAR AHORA
            </Button>
            <Button variant="outline" className={styles.clearButton} onClick={onClearCart}>
              <Trash2 size={16} />
              Limpiar Carrito
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
