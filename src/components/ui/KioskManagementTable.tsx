import React, { useState, useEffect, useRef } from 'react';
import { useKiosksList, useUpdateKiosk } from '../helpers/useAdminKioskQueries';
import { KioskWithLocation } from '../endpoints/admin/kiosks_GET.schema';
import { Skeleton } from './Skeleton';
import { Badge } from './Badge';
import { Button } from './Button';
import { Switch } from './Switch';
import { Input } from './Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Copy, AlertCircle, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import styles from './KioskManagementTable.module.css';

// Placeholder for a locations query. In a real scenario, this would be a proper hook.
// For this task, we'll extract locations from the kiosks data itself.
const useLocations = (kiosks: KioskWithLocation[]) => {
  const locations = React.useMemo(() => {
    const locationMap = new Map<number, string>();
    kiosks.forEach(kiosk => {
      if (!locationMap.has(kiosk.locationId)) {
        locationMap.set(kiosk.locationId, kiosk.locationName);
      }
    });
    return Array.from(locationMap.entries()).map(([id, name]) => ({ id, name }));
  }, [kiosks]);
  return { data: locations, isLoading: false };
};

const KioskStatusBadge = ({ lastSeenAt }: { lastSeenAt: Date | null }) => {
  if (!lastSeenAt) {
    return <Badge variant="outline">Nunca</Badge>;
  }

  const now = new Date();
  const lastSeenDate = new Date(lastSeenAt);
  const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);

  if (diffMinutes < 5) {
    return <Badge variant="success">En línea</Badge>;
  }
  if (diffMinutes < 60) {
    return <Badge variant="warning">Inactivo</Badge>;
  }
  return <Badge variant="outline">Desconectado</Badge>;
};

const EditableCell = ({ kiosk, field }: { kiosk: KioskWithLocation; field: 'name' | 'locationId' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(field === 'name' ? kiosk.name : kiosk.locationId.toString());
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: updateKiosk, isPending } = useUpdateKiosk();
  const { data: kiosks } = useKiosksList();
  const { data: locations } = useLocations(kiosks || []);

  useEffect(() => {
    if (isEditing && field === 'name' && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing, field]);

  const handleSave = () => {
    const originalValue = field === 'name' ? kiosk.name : kiosk.locationId;
    const parsedValue = field === 'name' ? value : parseInt(value, 10);

    if (parsedValue !== originalValue) {
      updateKiosk({ id: kiosk.id, [field]: parsedValue });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(field === 'name' ? kiosk.name : kiosk.locationId.toString());
      setIsEditing(false);
    }
  };

  if (isEditing && field === 'name') {
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={isPending}
        className={styles.inlineInput}
      />
    );
  }

  if (field === 'locationId') {
    return (
      <Select
        value={kiosk.locationId.toString()}
        onValueChange={(newLocationId) => {
          if (parseInt(newLocationId, 10) !== kiosk.locationId) {
            updateKiosk({ id: kiosk.id, locationId: parseInt(newLocationId, 10) });
          }
        }}
        disabled={isPending}
      >
        <SelectTrigger className={styles.selectTrigger}>
          <SelectValue placeholder="Select location" />
        </SelectTrigger>
        <SelectContent>
          {locations?.map(loc => (
            <SelectItem key={loc.id} value={loc.id.toString()}>
              {loc.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <span onClick={() => setIsEditing(true)} className={styles.editableText}>
      {kiosk.name}
    </span>
  );
};

export const KioskManagementTable = () => {
  const { data: kiosks, isLoading, isError, error } = useKiosksList();
  const { mutate: updateKiosk, isPending: isUpdating } = useUpdateKiosk();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Device code copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className={styles.skeletonContainer}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className={styles.skeletonRow}>
            <Skeleton style={{ height: '24px', width: '40px' }} />
            <Skeleton style={{ height: '24px', width: '150px' }} />
            <Skeleton style={{ height: '24px', width: '150px' }} />
            <Skeleton style={{ height: '24px', width: '200px' }} />
            <Skeleton style={{ height: '24px', width: '60px' }} />
            <Skeleton style={{ height: '24px', width: '120px' }} />
            <Skeleton style={{ height: '24px', width: '100px' }} />
            <Skeleton style={{ height: '24px', width: '40px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.errorState}>
        <AlertCircle size={48} />
        <h2>Error al cargar los kiosks</h2>
        <p>{error instanceof Error ? error.message : 'Ocurrió un error inesperado.'}</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Ubicación</th>
            <th>Device Code</th>
            <th>Estado</th>
            <th>Último Visto</th>
            <th>Status</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {kiosks?.map((kiosk) => (
            <tr key={kiosk.id} className={isUpdating ? styles.disabledRow : ''}>
              <td>{kiosk.id}</td>
              <td>
                <EditableCell kiosk={kiosk} field="name" />
              </td>
              <td>
                <EditableCell kiosk={kiosk} field="locationId" />
              </td>
              <td>
                <div className={styles.deviceCodeCell}>
                  <span className={styles.deviceCode}>{kiosk.deviceCode}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleCopy(kiosk.deviceCode)}
                    aria-label="Copy device code"
                  >
                    <Copy size={14} />
                  </Button>
                </div>
              </td>
              <td>
                <Switch
                  checked={kiosk.isActive}
                  onCheckedChange={(checked) => updateKiosk({ id: kiosk.id, isActive: checked })}
                  disabled={isUpdating}
                  aria-label={kiosk.isActive ? 'Deactivate kiosk' : 'Activate kiosk'}
                />
              </td>
              <td>
                {kiosk.lastSeenAt
                  ? formatDistanceToNow(new Date(kiosk.lastSeenAt), { addSuffix: true, locale: es })
                  : 'Nunca'}
              </td>
              <td>
                <KioskStatusBadge lastSeenAt={kiosk.lastSeenAt} />
              </td>
              <td>
                <Button variant="ghost" size="icon-sm" disabled>
                  <MoreVertical size={16} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};