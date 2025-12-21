import React from "react";
import { formatCurrency, formatInteger } from "../helpers/numberUtils";
import { formatDate } from "../helpers/dateUtils";
import { Button } from "./Button";
import { Printer, Download, ArrowUpCircle, ArrowDownCircle, Minus } from "lucide-react";
import styles from "./CashReportView.module.css";

type CashReport = {
  sessionId: string | null;
  openedAt: Date;
  closedAt: Date | null;
  openingAmount: number;
  closingAmount: number | null;
  expectedCash: number;
  actualCash: number | null;
  difference: number | null;
  totalSales: number;
  totalCash: number;
  totalCard: number;
  totalTransactions: number;
  movementsIn: number;
  movementsOut: number;
};

interface CashReportViewProps {
  report: CashReport;
  onPrint?: () => void;
  onExport?: () => void;
  className?: string;
}

export const CashReportView = ({
  report,
  onPrint,
  onExport,
  className,
}: CashReportViewProps) => {
  const isDifferencePositive = (report.difference || 0) > 0;
  const isDifferenceNegative = (report.difference || 0) < 0;

  return (
    <div className={`${styles.reportContainer} ${className || ""}`}>
      <div className={styles.header}>
        <h2>Reporte de Caja</h2>
        <div className={styles.actions}>
          {onPrint && (
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer size={16} /> Imprimir
            </Button>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download size={16} /> Exportar
            </Button>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h3>Información de Sesión</h3>
        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.label}>ID Sesión:</span>
            <span>{report.sessionId}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Apertura:</span>
            <span>{formatDate(report.openedAt, 'PPpp')}</span>
          </div>
          {report.closedAt && (
            <div className={styles.field}>
              <span className={styles.label}>Cierre:</span>
              <span>{formatDate(report.closedAt, 'PPpp')}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h3>Resumen de Ventas</h3>
        <div className={styles.statsGrid}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total Transacciones</span>
            <span className={styles.statValue}>
              {report.totalTransactions}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Ventas Totales</span>
            <span className={styles.statValue}>
              {formatCurrency(report.totalSales)}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Efectivo</span>
            <span className={styles.statValue}>
              {formatCurrency(report.totalCash)}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Tarjeta</span>
            <span className={styles.statValue}>
              {formatCurrency(report.totalCard)}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Balance de Efectivo</h3>
        <div className={styles.balanceTable}>
          <div className={styles.balanceRow}>
            <span>Monto Apertura:</span>
            <span>{formatCurrency(report.openingAmount)}</span>
          </div>
          <div className={styles.balanceRow}>
            <span>+ Ventas Efectivo:</span>
            <span>{formatCurrency(report.totalCash)}</span>
          </div>
          <div className={styles.balanceRow}>
            <span>+ Entradas:</span>
            <span>{formatCurrency(report.movementsIn)}</span>
          </div>
          <div className={styles.balanceRow}>
            <span>- Salidas:</span>
            <span>{formatCurrency(report.movementsOut)}</span>
          </div>
          <div className={`${styles.balanceRow} ${styles.total}`}>
            <span>Efectivo Esperado:</span>
            <strong>{formatCurrency(report.expectedCash)}</strong>
          </div>
          {report.actualCash !== null && (
            <>
              <div className={styles.balanceRow}>
                <span>Efectivo Contado:</span>
                <span>{formatCurrency(report.actualCash)}</span>
              </div>
              <div className={`${styles.balanceRow} ${styles.difference} ${
                isDifferencePositive ? styles.positive : 
                isDifferenceNegative ? styles.negative : ''
              }`}>
                <span>Diferencia:</span>
                <strong>{formatCurrency(report.difference || 0)}</strong>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};