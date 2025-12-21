import { useState } from "react";
import { useCustomerPointsTransactionsQuery } from "../helpers/useCustomerQueries";
import { type PointsTransactionType } from "../helpers/schema";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import { AlertTriangle, Receipt } from "lucide-react";
import styles from "./CustomerPointsHistory.module.css";

interface CustomerPointsHistoryProps {
  customerId?: number | null;
}

const getBadgeVariant = (type: PointsTransactionType) => {
  switch (type) {
    case "earned":
      return "success";
    case "redeemed":
      return "destructive";
    case "bonus":
      return "secondary";
    case "adjustment":
      return "warning";
    default:
      return "default";
  }
};

export const CustomerPointsHistory = ({ customerId }: CustomerPointsHistoryProps) => {
  const [typeFilter, setTypeFilter] = useState<"all" | PointsTransactionType>("all");
  const { data: transactions, isFetching, error } = useCustomerPointsTransactionsQuery(customerId);

  const filteredTransactions = transactions?.filter(
    (t) => typeFilter === "all" || t.transactionType === typeFilter
  ) ?? [];

  const renderContent = () => {
    if (isFetching) {
      return (
        <div className={styles.list}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={styles.item}>
              <div className={styles.itemMain}>
                <Skeleton style={{ height: '1.25rem', width: '60%' }} />
                <Skeleton style={{ height: '1rem', width: '80%', marginTop: 'var(--spacing-1)' }} />
              </div>
              <div className={styles.itemAside}>
                <Skeleton style={{ height: '1.5rem', width: '50px' }} />
                <Skeleton style={{ height: '1rem', width: '70px', marginTop: 'var(--spacing-1)' }} />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.stateContainer}>
          <AlertTriangle size={32} className={styles.errorIcon} />
          <h4>Error loading history</h4>
          <p>{error.message}</p>
        </div>
      );
    }

    if (filteredTransactions.length === 0) {
      return (
        <div className={styles.stateContainer}>
          <Receipt size={32} />
          <h4>No transactions found</h4>
          <p>{typeFilter === "all" ? "This customer has no points history." : "No transactions match the current filter."}</p>
        </div>
      );
    }

    return (
      <div className={styles.list}>
        {filteredTransactions.map((tx) => (
          <div key={tx.id} className={styles.item}>
            <div className={styles.itemMain}>
              <Badge variant={getBadgeVariant(tx.transactionType)}>{tx.transactionType}</Badge>
              <p className={styles.description}>{tx.description || "No description"}</p>
            </div>
            <div className={styles.itemAside}>
              <span className={`${styles.points} ${tx.pointsAmount < 0 ? styles.negative : styles.positive}`}>
                {tx.pointsAmount > 0 ? `+${tx.pointsAmount}` : tx.pointsAmount}
              </span>
              <time className={styles.date}>
                {new Date(tx.createdAt as Date).toLocaleString()}
              </time>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.filterBar}>
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
          <SelectTrigger className={styles.filterSelect}>
            <SelectValue placeholder="Filter by type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="earned">Earned</SelectItem>
            <SelectItem value="redeemed">Redeemed</SelectItem>
            <SelectItem value="bonus">Bonus</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {renderContent()}
    </div>
  );
};