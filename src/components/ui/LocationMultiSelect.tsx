import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useActiveLocationsQuery } from '../helpers/useLocationsQueries';
import { Input } from './Input';
import { Checkbox } from './Checkbox';
import { Badge } from './Badge';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { X, Search, ChevronDown, ChevronsUpDown } from 'lucide-react';
import styles from './LocationMultiSelect.module.css';
import { type LocationType } from '../helpers/schema';

export interface LocationMultiSelectProps {
  selectedLocationIds: number[];
  onChange: (locationIds: number[]) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  error?: string;
}

const LocationBadge = ({ type }: { type: LocationType }) => {
  const variantMap: Record<LocationType, 'default' | 'secondary' | 'success'> = {
    tienda: 'default',
    bodega: 'secondary',
    kiosk: 'success',
  };
  return <Badge variant={variantMap[type]}>{type}</Badge>;
};

export const LocationMultiSelect = ({
  selectedLocationIds,
  onChange,
  label,
  placeholder = 'Select locations...',
  className,
  error,
}: LocationMultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: locations, isLoading, isError } = useActiveLocationsQuery();

  const sortedLocations = useMemo(() => {
    return [...(locations ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  }, [locations]);

  const filteredLocations = useMemo(() => {
    if (!debouncedSearchTerm) {
      return sortedLocations;
    }
    return sortedLocations.filter(
      (location) =>
        location.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        location.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [sortedLocations, debouncedSearchTerm]);

  const selectedLocations = useMemo(() => {
    return sortedLocations.filter((loc) => selectedLocationIds.includes(loc.id));
  }, [sortedLocations, selectedLocationIds]);

  const handleToggle = (locationId: number) => {
    const newSelection = selectedLocationIds.includes(locationId)
      ? selectedLocationIds.filter((id) => id !== locationId)
      : [...selectedLocationIds, locationId];
    onChange(newSelection);
  };

  const handleSelectAll = () => {
    onChange(sortedLocations.map((loc) => loc.id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const renderTriggerContent = () => {
    if (selectedLocationIds.length === 0) {
      return <span className={styles.placeholder}>{placeholder}</span>;
    }
    if (selectedLocationIds.length === 1) {
      return <span>{selectedLocations[0]?.name ?? '1 location selected'}</span>;
    }
    return <span>{selectedLocationIds.length} locations selected</span>;
  };

  return (
    <div className={`${styles.wrapper} ${className || ''}`} ref={wrapperRef}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.selectContainer}>
        <button
          type="button"
          className={`${styles.trigger} ${error ? styles.errorBorder : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          {renderTriggerContent()}
          <ChevronsUpDown className={styles.chevron} size={16} />
        </button>

        {isOpen && (
          <div className={styles.popover}>
            <div className={styles.chipsContainer}>
              {selectedLocations.map((location) => (
                <div key={location.id} className={styles.chip}>
                  <span>{location.name}</span>
                  <button
                    type="button"
                    className={styles.chipRemove}
                    onClick={() => handleToggle(location.id)}
                    aria-label={`Remove ${location.name}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.searchContainer}>
              <Search className={styles.searchIcon} size={16} />
              <Input
                type="text"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.listContainer}>
              {isLoading ? (
                <div className={styles.skeletonContainer}>
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className={styles.skeletonItem} />
                  ))}
                </div>
              ) : isError ? (
                <div className={styles.stateMessage}>Failed to load locations.</div>
              ) : filteredLocations.length === 0 ? (
                <div className={styles.stateMessage}>No locations found.</div>
              ) : (
                <ul className={styles.list}>
                  {filteredLocations.map((location) => (
                    <li key={location.id} className={styles.listItem}>
                      <label className={styles.itemLabel}>
                        <Checkbox
                          checked={selectedLocationIds.includes(location.id)}
                          onChange={() => handleToggle(location.id)}
                        />
                        <span className={styles.itemName}>{location.name}</span>
                        <LocationBadge type={location.locationType} />
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.footer}>
              <div className={styles.count}>
                {selectedLocationIds.length} / {sortedLocations.length} selected
              </div>
              <div className={styles.actions}>
                <Button variant="link" size="sm" onClick={handleClearAll}>
                  Clear
                </Button>
                <Button variant="link" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
};