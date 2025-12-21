import { useState } from "react";
import { type Selectable } from "kysely";
import { type Suppliers } from "../helpers/schema";
import { useSuppliersQuery } from "../helpers/useSupplierQueries";
import { useDeleteSupplierMutation } from "../helpers/useSupplierMutations";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import { SupplierForm } from "./SupplierForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dialog";
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import styles from "./SupplierTable.module.css";

interface SupplierTableProps {
  onAddSupplier: () => void;
}

export const SupplierTable = ({ onAddSupplier }: SupplierTableProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Selectable<Suppliers> | null>(null);
  const [deleteSupplier, setDeleteSupplier] = useState<Selectable<Suppliers> | null>(null);

  const { data: suppliers, isFetching, error } = useSuppliersQuery();
  const deleteMutation = useDeleteSupplierMutation();

  const handleEditSupplier = (supplier: Selectable<Suppliers>) => {
    setEditingSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingSupplier(null);
  };

  const handleDeleteClick = (supplier: Selectable<Suppliers>) => {
    setDeleteSupplier(supplier);
  };

  const handleConfirmDelete = () => {
    if (deleteSupplier) {
      deleteMutation.mutate(
        { id: deleteSupplier.id },
        {
          onSuccess: () => {
            setDeleteSupplier(null);
          },
        }
      );
    }
  };

  const handleCancelDelete = () => {
    setDeleteSupplier(null);
  };

  const renderContent = () => {
    if (isFetching) {
      return (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div className={styles.headerCell}>Supplier</div>
            <div className={styles.headerCell}>Contact Person</div>
            <div className={styles.headerCell}>Email</div>
            <div className={styles.headerCell}>Phone</div>
            <div className={styles.headerCell}>Actions</div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={styles.tableRow}>
              <div className={styles.cell}><Skeleton style={{ height: '1.5rem', width: '80%' }} /></div>
              <div className={styles.cell}><Skeleton style={{ height: '1.5rem', width: '60px' }} /></div>
              <div className={styles.cell}><Skeleton style={{ height: '1.5rem', width: '120px' }} /></div>
              <div className={styles.cell}><Skeleton style={{ height: '1.5rem', width: '100px' }} /></div>
              <div className={styles.cell}><Skeleton style={{ height: '1.5rem', width: '80px' }} /></div>
              <div className={styles.cell}><Skeleton style={{ height: '1.5rem', width: '60px' }} /></div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.errorState}>
          <AlertTriangle size={48} />
          <h3>Error loading suppliers</h3>
          <p>{error.message}</p>
        </div>
      );
    }

    if (!suppliers || suppliers.length === 0) {
      return (
        <div className={styles.emptyState}>
          <h3>No suppliers found</h3>
          <p>Get started by adding a new supplier to manage your inventory sources.</p>
          <Button onClick={onAddSupplier}><Plus size={16} /> Add Supplier</Button>
        </div>
      );
    }

    return (
      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <div className={styles.headerCell}>Supplier</div>
          <div className={styles.headerCell}>Contact Person</div>
          <div className={styles.headerCell}>Email</div>
          <div className={styles.headerCell}>Phone</div>
          <div className={styles.headerCell}>Términos de Pago</div>
          <div className={styles.headerCell}>Actions</div>
        </div>
        {suppliers.map((supplier) => {
          const formatPaymentTerms = () => {
            if (!supplier.paymentTermsType) return '-';
            if (supplier.paymentTermsType === 'CONTADO') return 'Contado';
            if (supplier.paymentTermsType === 'CREDITO') {
              const days = supplier.creditDays || 0;
              return `Crédito ${days} días`;
            }
            return '-';
          };

          return (
            <div key={supplier.id} className={styles.tableRow}>
              <div className={styles.cell} data-label="Supplier">
                <div className={styles.supplierInfo}>
                  <div className={styles.supplierName}>{supplier.name}</div>
                  {supplier.address && (
                    <div className={styles.supplierAddress}>{supplier.address}</div>
                  )}
                </div>
              </div>
              <div className={styles.cell} data-label="Contact Person">
                {supplier.contactPerson || '-'}
              </div>
              <div className={styles.cell} data-label="Email">
                {supplier.email ? (
                  <a href={`mailto:${supplier.email}`} className={styles.emailLink}>
                    {supplier.email}
                  </a>
                ) : (
                  '-'
                )}
              </div>
              <div className={styles.cell} data-label="Phone">
                {supplier.phone ? (
                  <a href={`tel:${supplier.phone}`} className={styles.phoneLink}>
                    {supplier.phone}
                  </a>
                ) : (
                  '-'
                )}
              </div>
              <div className={styles.cell} data-label="Términos de Pago">
                {formatPaymentTerms()}
              </div>
              <div className={styles.cell} data-label="Actions">
                <div className={styles.actions}>
                  <Button variant="ghost" size="icon-sm" onClick={() => handleEditSupplier(supplier)}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteClick(supplier)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      <SupplierForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        supplier={editingSupplier}
      />
      <Dialog open={!!deleteSupplier} onOpenChange={(open) => !open && handleCancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteSupplier?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};