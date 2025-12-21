import { useMemo } from "react";
import { format, isBefore, addDays, differenceInDays } from "date-fns";
import { type ProductLotWithProduct } from "../endpoints/product-lots_GET.schema";
import { useProductLotsQuery } from "../helpers/useInventoryQueries";
import { Skeleton } from "./Skeleton";
import { Badge } from "./Badge";
import { AlertTriangle, Archive } from "lucide-react";
import styles from "./ProductLotTable.module.css";

interface ProductLotTableProps {
  filters: {
    productUuid?: string;
  };
}

const getLotStatus = (expiresOn: Date | null): { text: string; variant: 'success' | 'warning' | 'destructive' | 'default' } => {
  if (!expiresOn) {
    return { text: 'No Expiry', variant: 'default' };
  }
  const today = new Date();
  const expiryDate = new Date(expiresOn);
  
  if (isBefore(expiryDate, today)) {
    return { text: 'Expired', variant: 'destructive' };
  }
  
  const thirtyDaysFromNow = addDays(today, 30);
  if (isBefore(expiryDate, thirtyDaysFromNow)) {
    const daysLeft = differenceInDays(expiryDate, today);
    return { text: `Expires in ${daysLeft}d`, variant: 'warning' };
  }
  
  return { text: 'Active', variant: 'success' };
};

export const ProductLotTable = ({ filters }: ProductLotTableProps) => {
  const {
    data: lots,
    isFetching,
    error,
  } = useProductLotsQuery({
    productUuid: filters.productUuid,
  });

  const renderContent = () => {
    if (isFetching && !lots) {
      return (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div className={styles.headerCell}>Lot Code</div>
            <div className={styles.headerCell}>Product</div>
            <div className={styles.headerCell}>Expires On</div>
            <div className={styles.headerCell}>Status</div>
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={styles.tableRow}>
              <div className={styles.cell}><Skeleton style={{ height: '1.25rem', width: '120px' }} /></div>
              <div className={styles.cell}><Skeleton style={{ height: '1.25rem', width: '80%' }} /></div>
              <div className={styles.cell}><Skeleton style={{ height: '1.25rem', width: '100px' }} /></div>
              <div className={styles.cell}><Skeleton style={{ height: '1.5rem', width: '80px' }} /></div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.stateMessage}>
          <AlertTriangle size={48} className={styles.iconError} />
          <h3>Error Loading Product Lots</h3>
          <p>{error.message}</p>
        </div>
      );
    }

    if (!lots || lots.length === 0) {
      return (
        <div className={styles.stateMessage}>
          <Archive size={48} className={styles.iconDefault} />
          <h3>No Product Lots Found</h3>
          <p>No lots match the current filters. Create a new lot to get started.</p>
        </div>
      );
    }

    return (
      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <div className={styles.headerCell}>Lot Code</div>
          <div className={styles.headerCell}>Product</div>
          <div className={styles.headerCell}>Expires On</div>
          <div className={styles.headerCell}>Status</div>
        </div>
        {lots.map((lot) => {
          const status = getLotStatus(lot.expiresOn ? new Date(lot.expiresOn) : null);
          return (
            <div key={lot.id} className={styles.tableRow}>
              <div className={styles.cell} data-label="Lot Code">
                {lot.lotCode || <span className={styles.mutedText}>N/A</span>}
              </div>
              <div className={styles.cell} data-label="Product">
                {lot.product?.name || <span className={styles.mutedText}>Unknown Product</span>}
              </div>
              <div className={styles.cell} data-label="Expires On">
                {lot.expiresOn ? format(new Date(lot.expiresOn), "MMM d, yyyy") : <span className={styles.mutedText}>-</span>}
              </div>
              <div className={styles.cell} data-label="Status">
                <Badge variant={status.variant}>{status.text}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return <div className={styles.container}>{renderContent()}</div>;
};