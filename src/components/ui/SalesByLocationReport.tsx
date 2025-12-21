import React, { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, formatDistanceToNow, differenceInHours, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, ArrowDown, ArrowUp, BarChart2, Receipt, Repeat, ShoppingBag, Tag } from 'lucide-react';

import { useSalesByLocationReport } from '../helpers/useSalesReportQueries';
import { useActiveLocationsQuery } from '../helpers/useLocationsQueries';
import { formatCurrency } from '../helpers/numberUtils';
import { type SalesByLocationReportItem } from '../endpoints/admin/reports/sales_by_location_GET.schema';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from './Chart';
import { LocationMultiSelect } from './LocationMultiSelect';
import { Button } from './Button';
import { Input } from './Input';
import { Skeleton } from './Skeleton';
import { Badge } from './Badge';
import styles from './SalesByLocationReport.module.css';

type SortConfig = {
  key: keyof SalesByLocationReportItem | 'averageTicket';
  direction: 'ascending' | 'descending';
};

export const SalesByLocationReport = () => {
  const [filters, setFilters] = useState<{
    startDate?: Date;
    endDate?: Date;
    locationIds?: number[];
  }>({});

  const [localFilters, setLocalFilters] = useState<{
    startDate: string;
    endDate: string;
    locationIds: number[];
  }>({ startDate: '', endDate: '', locationIds: [] });

  const { data: report, isFetching, isError, refetch } = useSalesByLocationReport(filters);

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'totalSales', direction: 'descending' });

  const handleApplyFilters = useCallback(() => {
    const newFilters: typeof filters = {};
    if (localFilters.startDate) newFilters.startDate = new Date(localFilters.startDate);
    if (localFilters.endDate) newFilters.endDate = new Date(localFilters.endDate);
    if (localFilters.locationIds.length > 0) {
      newFilters.locationIds = localFilters.locationIds;
    }
    setFilters(newFilters);
  }, [localFilters]);

  const handleClearFilters = useCallback(() => {
    setLocalFilters({ startDate: '', endDate: '', locationIds: [] });
    setFilters({});
  }, []);

  const summaryStats = useMemo(() => {
    if (!report?.data) return null;
    const data = report.data;
    const totalSales = data.reduce((sum, item) => sum + item.totalSales, 0);
    const totalTransactions = data.reduce((sum, item) => sum + item.totalTransactions, 0);
    const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const activeLocations = data.filter(item => item.totalTransactions > 0).length;
    return { totalSales, totalTransactions, averageTicket, activeLocations };
  }, [report?.data]);

  const sortedData = useMemo(() => {
    if (!report?.data) return [];
    const sortableData = [...report.data];
    sortableData.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof SalesByLocationReportItem];
      const bValue = b[sortConfig.key as keyof SalesByLocationReportItem];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    return sortableData;
  }, [report?.data, sortConfig]);

  const chartData = useMemo(() => {
    return sortedData
      .slice(0, 10)
      .map(item => ({ name: item.locationName, sales: item.totalSales }));
  }, [sortedData]);

  const chartConfig = {
    sales: { label: 'Ventas', color: 'var(--chart-color-1)' },
  };

  const handleSort = (key: SortConfig['key']) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: SortConfig['key']) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const getLocationStatus = (lastSale: Date | null): { variant: 'success' | 'warning' | 'outline'; text: string } => {
    if (!lastSale) return { variant: 'outline', text: 'Inactiva' };
    const now = new Date();
    if (differenceInHours(now, lastSale) < 24) return { variant: 'success', text: 'Activa' };
    if (differenceInDays(now, lastSale) < 7) return { variant: 'warning', text: 'Reciente' };
    return { variant: 'outline', text: 'Inactiva' };
  };

  const renderContent = () => {
    if (isFetching) {
      return (
        <>
          <div className={styles.summaryGrid}>
            {[...Array(4)].map((_, i) => <Skeleton key={i} className={styles.summaryCardSkeleton} />)}
          </div>
          <div className={styles.chartContainer}>
            <Skeleton className={styles.fullHeightSkeleton} />
          </div>
          <div className={styles.tableContainer}>
            <Skeleton className={styles.fullHeightSkeleton} style={{ height: '300px' }} />
          </div>
        </>
      );
    }

    if (isError) {
      return (
        <div className={styles.messageContainer}>
          <AlertTriangle size={48} className={styles.errorIcon} />
          <h3>Error al cargar los datos</h3>
          <p>Hubo un problema al obtener el reporte. Por favor, intente de nuevo.</p>
          <Button onClick={() => refetch()} variant="outline">
            <Repeat size={16} /> Reintentar
          </Button>
        </div>
      );
    }

    if (!report?.data || report.data.length === 0) {
      return (
        <div className={styles.messageContainer}>
          <BarChart2 size={48} className={styles.emptyIcon} />
          <h3>No hay datos para el período seleccionado</h3>
          <p>Intente ajustar los filtros o espere a que se registren nuevas ventas.</p>
        </div>
      );
    }

    return (
      <>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <ShoppingBag size={20} />
              <h4>Total de Ventas</h4>
            </div>
            <p className={styles.cardValue}>{formatCurrency(summaryStats?.totalSales ?? 0)}</p>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <Receipt size={20} />
              <h4>Total de Transacciones</h4>
            </div>
            <p className={styles.cardValue}>{summaryStats?.totalTransactions.toLocaleString('es-CO') ?? 0}</p>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <Tag size={20} />
              <h4>Ticket Promedio</h4>
            </div>
            <p className={styles.cardValue}>{formatCurrency(summaryStats?.averageTicket ?? 0)}</p>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <BarChart2 size={20} />
              <h4>Ubicaciones Activas</h4>
            </div>
            <p className={styles.cardValue}>{summaryStats?.activeLocations ?? 0}</p>
          </div>
        </div>

        <div className={styles.chartContainer}>
          <h3 className={styles.sectionTitle}>Top 10 Ubicaciones por Ventas</h3>
          <ChartContainer config={chartConfig}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => formatCurrency(value as number, 0)} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <ChartTooltip
                cursor={{ fill: 'var(--muted)' }}
                content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
              />
              <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className={styles.tableContainer}>
          <h3 className={styles.sectionTitle}>Detalle por Ubicación</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th onClick={() => handleSort('locationName')}>Ubicación {renderSortIcon('locationName')}</th>
                  <th onClick={() => handleSort('totalSales')}>Total Ventas {renderSortIcon('totalSales')}</th>
                  <th onClick={() => handleSort('totalTransactions')}>Transacciones {renderSortIcon('totalTransactions')}</th>
                  <th onClick={() => handleSort('averageTicket')}>Ticket Promedio {renderSortIcon('averageTicket')}</th>
                  <th onClick={() => handleSort('firstSale')}>Primera Venta {renderSortIcon('firstSale')}</th>
                  <th onClick={() => handleSort('lastSale')}>Última Venta {renderSortIcon('lastSale')}</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item) => {
                  const status = getLocationStatus(item.lastSale);
                  return (
                    <tr key={item.locationId}>
                      <td>{item.locationName}</td>
                      <td className={styles.bold}>{formatCurrency(item.totalSales)}</td>
                      <td>{item.totalTransactions.toLocaleString('es-CO')}</td>
                      <td>{formatCurrency(item.averageTicket)}</td>
                      <td>{item.firstSale ? format(item.firstSale, 'dd MMM yyyy', { locale: es }) : '-'}</td>
                      <td>{item.lastSale ? formatDistanceToNow(item.lastSale, { addSuffix: true, locale: es }) : '-'}</td>
                      <td><Badge variant={status.variant}>{status.text}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <Input
          type="date"
          value={localFilters.startDate}
          onChange={(e) => setLocalFilters(prev => ({ ...prev, startDate: e.target.value }))}
          className={styles.filterInput}
        />
        <Input
          type="date"
          value={localFilters.endDate}
          onChange={(e) => setLocalFilters(prev => ({ ...prev, endDate: e.target.value }))}
          className={styles.filterInput}
        />
        <LocationMultiSelect
          selectedLocationIds={localFilters.locationIds}
          onChange={(locationIds) => setLocalFilters(prev => ({ ...prev, locationIds }))}
          placeholder="Todas las ubicaciones"
          className={styles.filterInput}
        />
        <Button onClick={handleApplyFilters} disabled={isFetching}>Aplicar filtros</Button>
        <Button onClick={handleClearFilters} variant="ghost" disabled={isFetching}>Limpiar</Button>
      </div>
      <div className={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
};