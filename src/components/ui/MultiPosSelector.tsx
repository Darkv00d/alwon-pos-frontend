import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, MapPin, Monitor } from 'lucide-react';

import { useAdminPosEquipmentQuery } from '../helpers/useAdminPosLocationsQueries';
import { useSelectedEquipment } from '../helpers/equipmentSelection';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { Skeleton } from './Skeleton';
import { Badge } from './Badge';
import styles from './MultiPosSelector.module.css';
import type { LocationType } from '../helpers/schema';

const LocationTypeLabels: Record<LocationType, string> = {
  tienda: "Tienda",
  bodega: "Bodega", 
  kiosk: "Kiosko"
};

export const MultiPosSelector = () => {
  const { data: equipment, isLoading, isError } = useAdminPosEquipmentQuery();
  const [globalSelectedEquipment, setGlobalSelectedEquipment] = useSelectedEquipment();

  // Local state to manage selections before applying
  const [localSelectedIds, setLocalSelectedIds] = useState<number[]>(globalSelectedEquipment);

  // Sync local state if global state changes from another component
  useEffect(() => {
    setLocalSelectedIds(globalSelectedEquipment);
  }, [globalSelectedEquipment]);

  // Group equipment by location
  const equipmentByLocation = useMemo(() => {
    if (!equipment) return {};
    
    return equipment.reduce((acc, item) => {
      const locationKey = `${item.locationId}`;
      if (!acc[locationKey]) {
        acc[locationKey] = {
          locationId: item.locationId,
          locationName: item.locationName,
          locationType: item.locationType,
          address: item.address,
          equipment: []
        };
      }
      acc[locationKey].equipment.push(item);
      return acc;
    }, {} as Record<string, {
      locationId: number;
      locationName: string;
      locationType: LocationType;
      address: string | null;
      equipment: typeof equipment;
    }>);
  }, [equipment]);

  const handleToggle = (equipmentId: number) => {
    setLocalSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(equipmentId)) {
        newSet.delete(equipmentId);
      } else {
        newSet.add(equipmentId);
      }
      return Array.from(newSet);
    });
  };

  const handleLocationToggle = (locationEquipment: typeof equipment) => {
    if (!locationEquipment) return;
    
    const locationEquipmentIds = locationEquipment.map(eq => eq.id);
    const allSelected = locationEquipmentIds.every(id => localSelectedIds.includes(id));
    
    setLocalSelectedIds(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Remove all equipment from this location
        locationEquipmentIds.forEach(id => newSet.delete(id));
      } else {
        // Add all equipment from this location
        locationEquipmentIds.forEach(id => newSet.add(id));
      }
      return Array.from(newSet);
    });
  };

  const handleSelectAll = () => {
    // "Todos" means no specific equipment selected (all considered)
    setLocalSelectedIds([]);
  };

  const handleApply = () => {
    setGlobalSelectedEquipment(localSelectedIds);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className={styles.skeletonContainer}>
          <Skeleton style={{ height: '1.5rem', width: '4rem', marginBottom: 'var(--spacing-2)' }} />
          {[...Array(3)].map((_, i) => (
            <div key={i} className={styles.skeletonItem}>
              <Skeleton style={{ height: '1.25rem', width: '1.25rem', borderRadius: 'var(--radius-sm)' }} />
              <Skeleton style={{ height: '1rem', width: '80%' }} />
            </div>
          ))}
        </div>
      );
    }

    if (isError) {
      return <div className={styles.error}>Error al cargar equipos POS.</div>;
    }

    const locationGroups = Object.values(equipmentByLocation);

    return (
      <>
        <Button variant="link" size="sm" onClick={handleSelectAll} className={styles.selectAllButton}>
          Todos
        </Button>
        <div className={styles.locationsList}>
          {locationGroups.map(locationGroup => {
            const locationEquipmentIds = locationGroup.equipment.map(eq => eq.id);
            const allSelected = locationEquipmentIds.every(id => localSelectedIds.includes(id));
            const someSelected = locationEquipmentIds.some(id => localSelectedIds.includes(id));
            
            return (
              <div key={locationGroup.locationId} className={styles.locationGroup}>
                <div className={styles.locationHeader}>
                  <label className={styles.locationHeaderLabel}>
                    <Checkbox
                      checked={allSelected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = someSelected && !allSelected;
                        }
                      }}
                      onChange={() => handleLocationToggle(locationGroup.equipment)}
                    />
                    <div className={styles.locationInfo}>
                      <div className={styles.locationName}>
                        <MapPin size={14} />
                        <span>{locationGroup.locationName}</span>
                        <Badge variant="outline" className={styles.locationTypeBadge}>
                          {LocationTypeLabels[locationGroup.locationType]}
                        </Badge>
                      </div>
                      {locationGroup.address && (
                        <div className={styles.locationAddress}>
                          {locationGroup.address}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
                
                <div className={styles.equipmentList}>
                  {locationGroup.equipment.map(equipmentItem => (
                    <label key={equipmentItem.id} className={styles.equipmentItem}>
                      <Checkbox
                        checked={localSelectedIds.includes(equipmentItem.id)}
                        onChange={() => handleToggle(equipmentItem.id)}
                      />
                      <div className={styles.equipmentInfo}>
                        <div className={styles.equipmentName}>
                          <Monitor size={12} />
                          <span>{equipmentItem.name}</span>
                        </div>
                        {equipmentItem.code && (
                          <Badge variant="outline" className={styles.equipmentCode}>
                            {equipmentItem.code}
                          </Badge>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <Button onClick={handleApply} size="sm" className={styles.applyButton}>
          Aplicar
        </Button>
      </>
    );
  };

  const selectionCount = globalSelectedEquipment.length;

  return (
    <div className={styles.container}>
      <Button variant="outline" size="sm" className={styles.triggerButton}>
        Equipos POS {selectionCount > 0 && `(${selectionCount})`}
        <ChevronDown size={16} />
      </Button>
      <div className={styles.dropdown}>
        {renderContent()}
      </div>
    </div>
  );
};