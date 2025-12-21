import React from 'react';
import { Badge } from './Badge';
import { type PurchaseOrderStatus } from '../helpers/schema';
import styles from './PurchaseOrderStatusBadge.module.css';

interface PurchaseOrderStatusBadgeProps {
  status: PurchaseOrderStatus;
  className?: string;
}

export const PurchaseOrderStatusBadge = ({ status, className }: PurchaseOrderStatusBadgeProps) => {
  const statusConfig: Record<PurchaseOrderStatus, { variant: React.ComponentProps<typeof Badge>['variant']; label: string }> = {
    draft: { variant: 'warning', label: 'Draft' },
    sent: { variant: 'default', label: 'Sent' },
    received: { variant: 'success', label: 'Received' },
    cancelled: { variant: 'destructive', label: 'Cancelled' },
  };

  const { variant, label } = statusConfig[status] || { variant: 'outline', label: 'Unknown' };

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
};