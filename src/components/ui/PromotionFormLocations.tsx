import React from 'react';
import { MapPin } from 'lucide-react';
import { Checkbox } from './Checkbox';
import { LocationMultiSelect } from './LocationMultiSelect';
import styles from './PromotionFormLocations.module.css';

export interface PromotionFormLocationsProps {
  selectedLocationIds: number[];
  appliesToAllLocations: boolean;
  onChange: (locationIds: number[], appliesToAll: boolean) => void;
}

export const PromotionFormLocations = ({
  selectedLocationIds,
  appliesToAllLocations,
  onChange,
}: PromotionFormLocationsProps) => {
  const handleAllLocationsChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isChecked = event.target.checked;
    if (isChecked) {
      // When checking "all locations", clear specific selections.
      onChange([], true);
    } else {
      // When unchecking, revert to the current selection.
      onChange(selectedLocationIds, false);
    }
  };

  const handleLocationSelectionChange = (locationIds: number[]) => {
    onChange(locationIds, false);
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>
        <MapPin size={18} />
        Ubicaciones donde aplica
      </h3>
      <div className={styles.content}>
        <label className={styles.checkboxContainer}>
          <Checkbox
            checked={appliesToAllLocations}
            onChange={handleAllLocationsChange}
          />
          <span className={styles.checkboxLabel}>
            Aplicar a todas las tiendas (actuales y futuras)
          </span>
        </label>

        {appliesToAllLocations ? (
          <p className={styles.infoText}>
            Esta promoción aplicará automáticamente a todas las ubicaciones.
          </p>
        ) : (
          <div className={styles.multiSelectWrapper}>
            <LocationMultiSelect
              selectedLocationIds={selectedLocationIds}
              onChange={handleLocationSelectionChange}
              label="Seleccionar ubicaciones específicas"
            />
          </div>
        )}
      </div>
    </div>
  );
};