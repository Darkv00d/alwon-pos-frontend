import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { useAdminPosEquipmentQuery } from '../helpers/useAdminPosLocationsQueries';
import { PosLocation } from '../endpoints/pos-locations_GET.schema';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectGroup,
  SelectSeparator,
} from './Select';
import { Skeleton } from './Skeleton';
import { Badge } from './Badge';
import styles from './PosSelector.module.css';

const LOCAL_STORAGE_KEY = 'Alwon_pos';
const ALL_LOCATIONS_VALUE = '__empty';

interface PosSelectorProps {
  className?: string;
  onSelectionChange?: (posId: string | null) => void;
}

export const PosSelector: React.FC<PosSelectorProps> = ({ className, onSelectionChange }) => {
  const [selectedPosId, setSelectedPosId] = useState<string>(ALL_LOCATIONS_VALUE);

  useEffect(() => {
    try {
      const savedPosId = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedPosId) {
        setSelectedPosId(savedPosId);
        if (onSelectionChange) {
          onSelectionChange(savedPosId === ALL_LOCATIONS_VALUE ? null : savedPosId);
        }
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
    }
  }, [onSelectionChange]);

  const { data: equipment, isFetching, isError, error } = useAdminPosEquipmentQuery();

  const handleValueChange = (value: string) => {
    setSelectedPosId(value);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, value);
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
    if (onSelectionChange) {
      onSelectionChange(value === ALL_LOCATIONS_VALUE ? null : value);
    }
  };

  if (isFetching) {
    return <Skeleton className={`${styles.skeleton} ${className || ''}`} />;
  }

  if (isError) {
    console.error('Error fetching POS equipment:', error);
    return (
      <div className={`${styles.errorContainer} ${className || ''}`}>
        <AlertCircle className={styles.errorIcon} />
        <span>Error al cargar equipos POS</span>
      </div>
    );
  }

  const equipmentList = equipment ?? [];

  // Group equipment by location
  const groupedEquipment = equipmentList.reduce((groups, item) => {
    const locationKey = `${item.locationId}`;
    if (!groups[locationKey]) {
      groups[locationKey] = {
        location: {
          id: item.locationId,
          name: item.locationName,
          type: item.locationType,
          address: item.address,
        },
        equipment: []
      };
    }
    groups[locationKey].equipment.push(item);
    return groups;
  }, {} as Record<string, { location: { id: number; name: string; type: string; address: string | null }, equipment: PosLocation[] }>);

  // Get the display name for selected equipment
  const getSelectedDisplayName = () => {
    if (selectedPosId === ALL_LOCATIONS_VALUE) {
      return "Todos los puntos";
    }
    
    const selectedEquipment = equipmentList.find(item => String(item.id) === selectedPosId);
    if (selectedEquipment) {
      return `${selectedEquipment.name} (${selectedEquipment.locationName})`;
    }
    
    return "Seleccionar punto de venta";
  };

  return (
    <div className={`${styles.posSelectorContainer} ${className || ''}`}>
      <MapPin className={styles.mapPinIcon} />
      <Select onValueChange={handleValueChange} value={selectedPosId}>
        <SelectTrigger className={styles.selectTrigger}>
          <SelectValue placeholder="Seleccionar punto de venta">
            {getSelectedDisplayName()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_LOCATIONS_VALUE}>Todos los puntos</SelectItem>
          {Object.keys(groupedEquipment).length > 0 && <SelectSeparator />}
          
          {Object.values(groupedEquipment).map((group, index) => (
            <SelectGroup key={group.location.id}>
              <SelectLabel className={styles.locationHeader}>
                <div className={styles.locationInfo}>
                  <span className={styles.locationName}>{group.location.name}</span>
                  <Badge variant="outline" className={styles.locationTypeBadge}>
                    {group.location.type}
                  </Badge>
                </div>
                {group.location.address && (
                  <div className={styles.locationAddress}>{group.location.address}</div>
                )}
              </SelectLabel>
              
              {group.equipment.map((item) => (
                <SelectItem key={item.id} value={String(item.id)} className={styles.equipmentItem}>
                  <div className={styles.equipmentInfo}>
                    <span className={styles.equipmentName}>{item.name}</span>
                    {item.code && (
                      <span className={styles.equipmentCode}>({item.code})</span>
                    )}
                  </div>
                </SelectItem>
              ))}
              
              {index < Object.values(groupedEquipment).length - 1 && <SelectSeparator />}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};