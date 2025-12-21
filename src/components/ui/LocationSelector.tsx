import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, MapPin, Monitor } from "lucide-react";
import { useLocationsQuery } from "../helpers/useLocationsQueries";
import { useAdminPosEquipmentQuery } from "../helpers/useAdminPosLocationsQueries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import styles from "./LocationSelector.module.css";
import type { LocationType, Locations } from "../helpers/schema";
import type { Selectable } from "kysely";

// Types for hierarchical selection
export interface HierarchicalSelection {
  locationIds: number[];
  posEquipmentIds: number[];
}

// Props for simple mode (backward compatibility)
interface SimpleLocationSelectorProps {
  hierarchical?: false;
  value?: number;
  onChange: (value: number) => void;
  placeholder?: string;
  allowClear?: boolean;
  showEquipment?: never;
  multiSelect?: never;
}

// Props for hierarchical mode
interface HierarchicalLocationSelectorProps {
  hierarchical: true;
  value?: HierarchicalSelection;
  onChange: (value: HierarchicalSelection) => void;
  placeholder?: string;
  allowClear?: boolean;
  showEquipment?: boolean;
  multiSelect?: boolean;
}

type LocationSelectorProps = SimpleLocationSelectorProps | HierarchicalLocationSelectorProps;

const LocationTypeLabels: Record<LocationType, string> = {
  tienda: "Tiendas",
  bodega: "Bodegas", 
  kiosk: "Kioscos"
};

export const LocationSelector = (props: LocationSelectorProps) => {
  const { placeholder = "Select a location...", allowClear = false, hierarchical = false } = props;
  
  // Data fetching
  const { data: locations, isLoading: locationsLoading, error: locationsError } = useLocationsQuery({ isActive: true });
  const { data: posEquipment, isLoading: equipmentLoading, error: equipmentError } = useAdminPosEquipmentQuery(
    hierarchical && props.showEquipment ? undefined : []
  );

  // Local state for hierarchical mode
  const [expandedLocations, setExpandedLocations] = useState<Set<number>>(new Set());

  // Group locations by type
  const locationsByType = useMemo(() => {
    if (!locations) return {} as Record<LocationType, Selectable<Locations>[]>;
    
    return locations.reduce((acc, location) => {
      const type = location.locationType;
      if (!acc[type]) acc[type] = [];
      acc[type].push(location);
      return acc;
    }, {} as Record<LocationType, Selectable<Locations>[]>);
  }, [locations]);

  // Group POS equipment by location
  const equipmentByLocation = useMemo(() => {
    if (!posEquipment) return {};
    
    return posEquipment.reduce((acc, equipment) => {
      if (!acc[equipment.locationId]) acc[equipment.locationId] = [];
      acc[equipment.locationId].push(equipment);
      return acc;
    }, {} as Record<number, typeof posEquipment>);
  }, [posEquipment]);

  // Handle simple mode
  if (!hierarchical) {
    const simpleProps = props as SimpleLocationSelectorProps;
    
    const handleValueChange = (val: string) => {
      const numValue = Number(val);
      if (allowClear && numValue === simpleProps.value) {
        simpleProps.onChange(0);
      } else {
        simpleProps.onChange(numValue);
      }
    };

    if (locationsLoading) {
      return <Skeleton style={{ height: '2.5rem' }} />;
    }

    if (locationsError) {
      return <div style={{ color: 'var(--error)' }}>Failed to load locations.</div>;
    }

    return (
      <Select
        value={simpleProps.value ? String(simpleProps.value) : undefined}
        onValueChange={handleValueChange}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowClear && <SelectItem value="0">-- Clear Filter --</SelectItem>}
          {locations?.map((location) => (
            <SelectItem key={location.id} value={String(location.id)}>
              {location.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Handle hierarchical mode
  const hierarchicalProps = props as HierarchicalLocationSelectorProps;
  const currentSelection = hierarchicalProps.value || { locationIds: [], posEquipmentIds: [] };

  const toggleLocationExpansion = (locationId: number) => {
    const newExpanded = new Set(expandedLocations);
    if (newExpanded.has(locationId)) {
      newExpanded.delete(locationId);
    } else {
      newExpanded.add(locationId);
    }
    setExpandedLocations(newExpanded);
  };

  const toggleLocationSelection = (locationId: number) => {
    const newLocationIds = currentSelection.locationIds.includes(locationId)
      ? currentSelection.locationIds.filter(id => id !== locationId)
      : [...currentSelection.locationIds, locationId];
    
    hierarchicalProps.onChange({
      ...currentSelection,
      locationIds: newLocationIds
    });
  };

  const toggleEquipmentSelection = (equipmentId: number) => {
    const newEquipmentIds = currentSelection.posEquipmentIds.includes(equipmentId)
      ? currentSelection.posEquipmentIds.filter(id => id !== equipmentId)
      : [...currentSelection.posEquipmentIds, equipmentId];
    
    hierarchicalProps.onChange({
      ...currentSelection,
      posEquipmentIds: newEquipmentIds
    });
  };

  const clearSelection = () => {
    hierarchicalProps.onChange({ locationIds: [], posEquipmentIds: [] });
  };

  const getSelectionSummary = () => {
    const locationCount = currentSelection.locationIds.length;
    const equipmentCount = hierarchicalProps.showEquipment ? currentSelection.posEquipmentIds.length : 0;
    
    if (locationCount === 0 && equipmentCount === 0) {
      return placeholder;
    }
    
    const parts = [];
    if (locationCount > 0) {
      parts.push(`${locationCount} ubicación${locationCount !== 1 ? 'es' : ''}`);
    }
    if (equipmentCount > 0) {
      parts.push(`${equipmentCount} equipo${equipmentCount !== 1 ? 's' : ''}`);
    }
    
    return parts.join(', ');
  };

  if (locationsLoading || (hierarchicalProps.showEquipment && equipmentLoading)) {
    return <Skeleton style={{ height: '2.5rem' }} />;
  }

  if (locationsError || (hierarchicalProps.showEquipment && equipmentError)) {
    return <div style={{ color: 'var(--error)' }}>Failed to load locations.</div>;
  }

  return (
    <div className={styles.hierarchicalContainer}>
      <div className={styles.selectionSummary}>
        <div className={styles.summaryText}>
          {getSelectionSummary()}
        </div>
        {allowClear && (currentSelection.locationIds.length > 0 || currentSelection.posEquipmentIds.length > 0) && (
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Clear
          </Button>
        )}
      </div>

      <div className={styles.treeContainer}>
        {(Object.entries(locationsByType) as [LocationType, Selectable<Locations>[]][]).map(([locationType, typeLocations]) => (
          <div key={locationType} className={styles.locationTypeGroup}>
            <div className={styles.locationTypeHeader}>
              <MapPin size={16} />
              <span className={styles.locationTypeLabel}>
                {LocationTypeLabels[locationType]}
              </span>
              <Badge variant="outline">{typeLocations.length}</Badge>
            </div>

            {typeLocations.map((location: Selectable<Locations>) => {
              const isLocationSelected = currentSelection.locationIds.includes(location.id);
              const locationEquipment = equipmentByLocation[location.id] || [];
              const hasEquipment = hierarchicalProps.showEquipment && locationEquipment.length > 0;
              const isExpanded = expandedLocations.has(location.id);

              return (
                <div key={location.id} className={styles.locationItem}>
                  <div className={styles.locationRow}>
                    {hasEquipment && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => toggleLocationExpansion(location.id)}
                        className={styles.expandButton}
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </Button>
                    )}
                    
                    <div
                      className={`${styles.locationLabel} ${isLocationSelected ? styles.selected : ''}`}
                      onClick={() => toggleLocationSelection(location.id)}
                    >
                      <MapPin size={14} />
                      <span>{location.name}</span>
                      {location.address && (
                        <span className={styles.address}>{location.address}</span>
                      )}
                    </div>
                  </div>

                  {hasEquipment && isExpanded && (
                    <div className={styles.equipmentList}>
                      {locationEquipment.map((equipment) => {
                        const isEquipmentSelected = currentSelection.posEquipmentIds.includes(equipment.id);
                        
                        return (
                          <div
                            key={equipment.id}
                            className={`${styles.equipmentItem} ${isEquipmentSelected ? styles.selected : ''}`}
                            onClick={() => toggleEquipmentSelection(equipment.id)}
                          >
                            <Monitor size={14} />
                            <span>{equipment.name}</span>
                            {equipment.code && (
                              <Badge variant="outline" className={styles.equipmentCode}>
                                {equipment.code}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};