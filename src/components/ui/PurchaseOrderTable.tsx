import React, { useState, useMemo } from 'react';
import { usePurchaseOrdersQuery } from '../helpers/usePurchaseOrderQueries';
import { useAutoGeneratePurchaseOrdersMutation, useUpdatePurchaseOrderMutation } from '../helpers/usePurchaseOrderMutations';
import { PurchaseOrderStatusBadge } from './PurchaseOrderStatusBadge';
import { Button } from './Button';
import { formatCurrency } from '../helpers/numberUtils';
import { Skeleton } from './Skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './Dialog';
import { PurchaseOrderForm } from './PurchaseOrderForm';
import { type PurchaseOrderDetails } from '../endpoints/purchase-orders_GET.schema';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle, Send, Sparkles, X } from 'lucide-react';
import styles from './PurchaseOrderTable.module.css';
import { type PurchaseOrderStatus } from '../helpers/schema';

type ActionType = 'send' | 'receive' | 'cancel';

export const PurchaseOrderTable = () => {
  const { data: purchaseOrders, isFetching, error } = usePurchaseOrdersQuery();
  const autoGenerateMutation = useAutoGeneratePurchaseOrdersMutation();
  const updateMutation = useUpdatePurchaseOrderMutation();

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderDetails | null>(null);
  const [actionToConfirm, setActionToConfirm] = useState<{ po: PurchaseOrderDetails; action: ActionType } | null>(null);

  const handleAutoGenerate = () => {
    autoGenerateMutation.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(`${data.count} purchase order(s) generated successfully!`);
      },
      onError: (err) => {
        if (err instanceof Error) {
          toast.error('Failed to generate POs', { description: err.message });
        }
      },
    });
  };

  const handleUpdateStatus = () => {
    if (!actionToConfirm) return;

    const { po, action } = actionToConfirm;
    let newStatus: PurchaseOrderStatus;
    let successMessage = '';

    switch (action) {
      case 'send':
        newStatus = 'sent';
        successMessage = `PO #${po.id} marked as sent.`;
        break;
      case 'receive':
        newStatus = 'received';
        successMessage = `PO #${po.id} marked as received.`;
        break;
      case 'cancel':
        newStatus = 'cancelled';
        successMessage = `PO #${po.id} has been cancelled.`;
        break;
      default:
        return;
    }

    updateMutation.mutate(
      { purchaseOrderId: po.id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(successMessage);
          setActionToConfirm(null);
        },
        onError: (err) => {
          if (err instanceof Error) {
            toast.error('Update failed', { description: err.message });
          }
        },
      }
    );
  };

  const sortedPurchaseOrders = useMemo(() => {
    if (!purchaseOrders) return [];
    return [...purchaseOrders].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [purchaseOrders]);

  const renderTableContent = () => {
    if (isFetching && !purchaseOrders) {
      return Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          <td><Skeleton style={{ height: '1.25rem' }} /></td>
          <td><Skeleton style={{ height: '1.25rem' }} /></td>
          <td><Skeleton style={{ height: '1.25rem' }} /></td>
          <td><Skeleton style={{ height: '1.25rem' }} /></td>
          <td><Skeleton style={{ height: '1.25rem' }} /></td>
          <td><Skeleton style={{ height: '1.25rem' }} /></td>
          <td><Skeleton style={{ height: '1.25rem' }} /></td>
        </tr>
      ));
    }

    if (error) {
      return (
        <tr>
          <td colSpan={7} className={styles.centeredCell}>
            <div className={styles.errorState}>
              <AlertTriangle />
              <p>Error loading purchase orders.</p>
            </div>
          </td>
        </tr>
      );
    }

    if (!sortedPurchaseOrders || sortedPurchaseOrders.length === 0) {
      return (
        <tr>
          <td colSpan={7} className={styles.centeredCell}>No purchase orders found.</td>
        </tr>
      );
    }

    return sortedPurchaseOrders.map(po => (
      <tr key={po.id}>
        <td data-label="PO ID">#{po.id}</td>
        <td data-label="Supplier">{po.supplier.name}</td>
        <td data-label="Status"><PurchaseOrderStatusBadge status={po.status ?? 'draft'} /></td>
        <td data-label="Total">{formatCurrency(Number(po.total))}</td>
        <td data-label="Created">
          {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : 'N/A'}
        </td>
        <td data-label="Expected">{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : 'N/A'}</td>
        <td data-label="Actions">
          <div className={styles.actions}>
            {po.status === 'draft' && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setActionToConfirm({ po, action: 'send' })}>
                  <Send size={14} /> Mark Sent
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setActionToConfirm({ po, action: 'cancel' })}>
                  <X size={14} /> Cancel
                </Button>
              </>
            )}
            {po.status === 'sent' && (
              <Button variant="ghost" size="sm" onClick={() => setActionToConfirm({ po, action: 'receive' })}>
                <CheckCircle size={14} /> Mark Received
              </Button>
            )}
          </div>
        </td>
      </tr>
    ));
  };

  const getConfirmationDialogContent = () => {
    if (!actionToConfirm) return null;
    const { po, action } = actionToConfirm;
    switch (action) {
      case 'send':
        return { title: 'Mark as Sent?', description: `Are you sure you want to mark PO #${po.id} as sent? This action cannot be undone.`, confirmText: 'Yes, Mark as Sent' };
      case 'receive':
        return { title: 'Mark as Received?', description: `Are you sure you want to mark PO #${po.id} as received? This will update product stock levels.`, confirmText: 'Yes, Mark as Received' };
      case 'cancel':
        return { title: 'Cancel Purchase Order?', description: `Are you sure you want to cancel PO #${po.id}?`, confirmText: 'Yes, Cancel PO', variant: 'destructive' as const };
      default:
        return null;
    }
  };

  const confirmationContent = getConfirmationDialogContent();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Purchase Orders</h1>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={handleAutoGenerate} disabled={autoGenerateMutation.isPending}>
            {autoGenerateMutation.isPending ? 'Generating...' : <><Sparkles size={16} /> Auto-Generate POs</>}
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>Create Purchase Order</Button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>PO ID</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Total</th>
              <th>Created</th>
              <th>Expected</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {renderTableContent()}
          </tbody>
        </table>
      </div>

      {/* Create PO Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className={styles.dialogContent}>
          <DialogHeader>
            <DialogTitle>Create New Purchase Order</DialogTitle>
          </DialogHeader>
          {/* This is a placeholder for the form submission logic */}
          <PurchaseOrderForm
            onCancel={() => setCreateModalOpen(false)}
            onSubmit={(values) => {
              console.log("Submitting new PO", values);
              // Here you would call a create mutation
              // createMutation.mutate(values, { onSuccess: () => setCreateModalOpen(false) });
              toast.info("Create functionality is not fully wired in this example.");
              setCreateModalOpen(false);
            }}
            isSubmitting={false}
          />
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={!!actionToConfirm} onOpenChange={() => setActionToConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmationContent?.title}</DialogTitle>
            <DialogDescription>{confirmationContent?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActionToConfirm(null)}>Cancel</Button>
            <Button
              variant={confirmationContent?.variant || 'primary'}
              onClick={handleUpdateStatus}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Updating...' : confirmationContent?.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};