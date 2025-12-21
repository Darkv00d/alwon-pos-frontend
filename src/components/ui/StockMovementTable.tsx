import { useMemo } from "react";
import { format } from "date-fns";
import { type StockMovementWithDetails } from "../endpoints/stock-movements_GET.schema";
import { type MoveType } from "../helpers/schema";
import { useStockMovementsQuery } from "../helpers/useInventoryQueries";
import { Skeleton } from "./Skeleton";
import { Badge } from "./Badge";
import { AlertTriangle, Package } from "lucide-react";
import styles from "./StockMovementTable.module.css";

interface StockMovementTableProps {
  filters: {
    productUuid?: string;
    locationId?: number;
    type?: MoveType;
    dateFrom?: Date | null;
    dateTo?: Date | null;
  };
}

const getBadgeVariant = (type: StockMovementWithDetails['type']) => {
  switch (type) {
    case "RECEIPT":
      return "success";
    case "SALE":
      return "destructive";
    case "TRANSFER":
      return "default";
    case "ADJUSTMENT":
      return "warning";
    case "RETURN":
      return "secondary";
    default:
      return "outline";
  }
};

export const StockMovementTable = ({ filters }: StockMovementTableProps) => {
  const {
    data: movements,
    isFetching,
    error,
  } = useStockMovementsQuery({
    productUuid: filters.productUuid,
    locationId: filters.locationId,
    type: filters.type,
  });

  const filteredMovements = useMemo(() => {
    if (!movements) return [];
    return movements.filter((movement) => {
      const movementDate = new Date(movement.createdAt);
      if (filters.dateFrom && movementDate < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && movementDate > filters.dateTo) {
        return false;
      }
      return true;
    });
  }, [movements, filters.dateFrom, filters.dateTo]);

  const renderContent = () => {
    if (isFetching && !movements) {
      return (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div className={styles.headerCell}>Date</div>
            <div className={styles.headerCell}>Product</div>
            <div className={styles.headerCell}>Type</div>
            <div className={styles.headerCell}>Qty</div>
            <div className={styles.headerCell}>Location</div>
            <div className={styles.headerCell}>Lot / Ref</div>
          </div>
          {[...Array(10)].map((_, i) => (
            <div key={i} className={styles.tableRow}>
              <div className={styles.cell}><Skeleton style={{ height: '1.25rem', width: '90%' }} /></div>
              <div className={styles.cell}><Skeleton style={{ height: '1.25rem', width: '80%' }} /></div>
              <div className={styles.cell}><Skeleton style={{ height: '1.5rem', width: '70px' }} /></div>
              <div className={styles.cell}><Skeleton style={{ height: '1.25rem', width: '40px' }} /></div>
              <div className={styles.cell}><Skeleton style={{ height: '1.25rem', width: '100px' }} /></div>
              <div className={styles.cell}><Skeleton style={{ height: '1.25rem', width: '120px' }} /></div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.stateMessage}>
          <AlertTriangle size={48} className={styles.iconError} />
          <h3>Error Loading Movements</h3>
          <p>{error.message}</p>
        </div>
      );
    }

    if (!filteredMovements || filteredMovements.length === 0) {
      return (
        <div className={styles.stateMessage}>
          <Package size={48} className={styles.iconDefault} />
          <h3>No Stock Movements Found</h3>
          <p>No movements match the current filters. Try adjusting your search.</p>
        </div>
      );
    }

    return (
      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <div className={styles.headerCell}>Date</div>
          <div className={styles.headerCell}>Product</div>
          <div className={styles.headerCell}>Type</div>
          <div className={styles.headerCell}>Qty</div>
          <div className={styles.headerCell}>Location</div>
          <div className={styles.headerCell}>Lot / Ref</div>
        </div>
        {filteredMovements.map((movement) => (
          <div key={movement.id} className={styles.tableRow}>
            <div className={styles.cell} data-label="Date">
              {format(new Date(movement.createdAt), "MMM d, yyyy HH:mm")}
            </div>
            <div className={styles.cell} data-label="Product">
              {movement.product?.name || 'N/A'}
            </div>
            <div className={styles.cell} data-label="Type">
              <Badge variant={getBadgeVariant(movement.type)}>{movement.type}</Badge>
            </div>
            <div className={`${styles.cell} ${styles.quantityCell}`} data-label="Qty">
              {Number(movement.qty)}
            </div>
            <div className={styles.cell} data-label="Location">
              {movement.location?.name || '-'}
            </div>
            <div className={styles.cell} data-label="Lot / Ref">
              <div className={styles.refInfo}>
                {movement.lot?.lotCode && <span>Lot: {movement.lot.lotCode}</span>}
                {movement.ref && <span>Ref: {movement.ref}</span>}
                {!movement.lot?.lotCode && !movement.ref && '-'}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return <div className={styles.container}>{renderContent()}</div>;
};