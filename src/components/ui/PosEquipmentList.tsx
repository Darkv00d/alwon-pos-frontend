import React from "react";
import { Selectable } from "kysely";
import { MapPin, Monitor, ChevronDown, ChevronUp } from "lucide-react";
import { Locations, LocationType } from "../helpers/schema";
import { PosEquipmentWithLocation } from "../endpoints/pos-equipment_GET.schema";
import { Badge } from "./Badge";
import { Switch } from "./Switch";
import styles from "./PosEquipmentList.module.css";

interface PosEquipmentListProps {
  locations: Selectable<Locations>[];
  equipmentByLocationId: Record<number, PosEquipmentWithLocation[]>;
  onToggleActive: (equipmentId: number, currentStatus: boolean) => void;
  isUpdating: boolean;
}

const LocationTypeLabels: Record<LocationType, string> = {
  tienda: "Tienda",
  bodega: "Bodega",
  kiosk: "Kiosco",
};

export function PosEquipmentList({
  locations,
  equipmentByLocationId,
  onToggleActive,
  isUpdating,
}: PosEquipmentListProps) {
  const [expandedLocations, setExpandedLocations] = React.useState<Set<number>>(new Set());

  const toggleLocation = (locationId: number) => {
    setExpandedLocations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.add(locationId);
      }
      return newSet;
    });
  };

  const locationsWithEquipment = locations.filter(
    (loc) => equipmentByLocationId[loc.id] && equipmentByLocationId[loc.id].length > 0
  );

  if (locationsWithEquipment.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Monitor size={48} className={styles.emptyIcon} />
        <h4>No se encontraron equipos</h4>
        <p>Intente ajustar los filtros o cree un nuevo equipo POS.</p>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      {locationsWithEquipment.map((location) => {
        const equipmentList = equipmentByLocationId[location.id] || [];
        const isExpanded = expandedLocations.has(location.id);

        return (
          <div key={location.id} className={styles.locationGroup}>
            <header className={styles.locationHeader} onClick={() => toggleLocation(location.id)}>
              <div className={styles.locationInfo}>
                <MapPin size={20} className={styles.locationIcon} />
                <div>
                  <h3 className={styles.locationName}>{location.name}</h3>
                  <p className={styles.locationAddress}>{location.address}</p>
                </div>
              </div>
              <div className={styles.locationMeta}>
                <Badge variant="outline">{LocationTypeLabels[location.locationType]}</Badge>
                <Badge variant="secondary">{equipmentList.length} Equipo(s)</Badge>
                <button className={styles.toggleButton}>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
            </header>
            {isExpanded && (
              <div className={styles.equipmentTableWrapper}>
                <table className={styles.equipmentTable}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Código</th>
                      <th>Descripción</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipmentList.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className={styles.nameCell}>
                            <Monitor size={16} />
                            {item.name}
                          </div>
                        </td>
                        <td>
                          <Badge variant="outline">{item.code || "N/A"}</Badge>
                        </td>
                        <td className={styles.descriptionCell}>{item.description || "-"}</td>
                        <td>
                          <div className={styles.statusCell}>
                            <Switch
                              checked={item.isActive}
                              onCheckedChange={() => onToggleActive(item.id, item.isActive)}
                              disabled={isUpdating}
                            />
                            <span className={item.isActive ? styles.activeText : styles.inactiveText}>
                              {item.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}