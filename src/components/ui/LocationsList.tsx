import { useLocationsQuery } from "../helpers/useInventoryQueries";
import { Skeleton } from "./Skeleton";
import { AlertTriangle, MapPin } from "lucide-react";
import styles from "./LocationsList.module.css";

export const LocationsList = () => {
  const { data: locations, isFetching, error } = useLocationsQuery();

  const renderContent = () => {
    if (isFetching) {
      return (
        <div className={styles.list}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={styles.item}>
              <div className={styles.itemContent}>
                <Skeleton style={{ height: '1.25rem', width: '120px' }} />
                <Skeleton style={{ height: '1rem', width: '80px' }} />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.stateMessage}>
          <AlertTriangle size={32} className={styles.iconError} />
          <h4>Error loading locations</h4>
          <p>{error.message}</p>
        </div>
      );
    }

    if (!locations || locations.length === 0) {
      return (
        <div className={styles.stateMessage}>
          <MapPin size={32} className={styles.iconDefault} />
          <h4>No Locations Found</h4>
          <p>No inventory locations have been configured yet.</p>
        </div>
      );
    }

    return (
      <div className={styles.list}>
        {locations.map((location) => (
          <div key={location.id} className={styles.item}>
            <MapPin className={styles.itemIcon} />
            <div className={styles.itemContent}>
              <div className={styles.name}>{location.name}</div>
              <div className={styles.code}>Code: {location.code}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Inventory Locations</h3>
      {renderContent()}
    </div>
  );
};