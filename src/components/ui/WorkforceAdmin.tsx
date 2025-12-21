import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInMinutes } from 'date-fns';
import { Clock, AlertCircle, RefreshCw, Users, UserCheck, Timer } from 'lucide-react';
import { getAdminWorkforcePunchesToday, AdminPunch, PunchesSummary } from '../endpoints/admin/workforce/punches_today_GET.schema';
import { Badge } from './Badge';
import { Skeleton } from './Skeleton';
import { Spinner } from './Spinner';
import styles from './WorkforceAdmin.module.css';

const ADMIN_WORKFORCE_PUNCHES_QUERY_KEY = ['admin', 'workforce', 'punches', 'today'];

const calculateDuration = (start: Date, end: Date | null): string => {
  const endDate = end || new Date();
  const totalMinutes = differenceInMinutes(endDate, start);
  if (totalMinutes < 0) return '0h 0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

const SummaryCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; description?: string }> = ({ 
  icon, title, value, description 
}) => (
  <div className={styles.summaryCard}>
    <div className={styles.summaryIcon}>{icon}</div>
    <div className={styles.summaryContent}>
      <div className={styles.summaryValue}>{value}</div>
      <div className={styles.summaryTitle}>{title}</div>
      {description && <div className={styles.summaryDescription}>{description}</div>}
    </div>
  </div>
);

const WorkforceAdminSkeleton: React.FC = () => (
  <>
    <div className={styles.summaryGrid}>
      {Array.from({ length: 3 }).map((_, index) => (
        <div className={styles.summaryCard} key={index}>
          <Skeleton style={{ width: '2rem', height: '2rem', borderRadius: '50%' }} />
          <div className={styles.summaryContent}>
            <Skeleton style={{ width: '3rem', height: '1.5rem' }} />
            <Skeleton style={{ width: '6rem', height: '1rem', marginTop: '4px' }} />
          </div>
        </div>
      ))}
    </div>
    <div className={styles.table}>
      <div className={styles.tableHeader}>
        <div className={styles.headerCell}>Employee</div>
        <div className={styles.headerCell}>Position</div>
        <div className={styles.headerCell}>Clock In</div>
        <div className={styles.headerCell}>Clock Out</div>
        <div className={styles.headerCell}>Hours Worked</div>
        <div className={styles.headerCell}>Status</div>
      </div>
      <div className={styles.tableBody}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div className={styles.tableRow} key={index}>
            <div className={styles.tableCell}>
              <div className={styles.employeeCell}>
                <Skeleton style={{ width: '120px', height: '1.2rem' }} />
                <Skeleton style={{ width: '80px', height: '1rem', marginTop: '4px' }} />
              </div>
            </div>
            <div className={styles.tableCell}>
              <div className={styles.positionCell}>
                <Skeleton style={{ width: '100px', height: '1rem' }} />
                <Skeleton style={{ width: '80px', height: '0.875rem', marginTop: '2px' }} />
              </div>
            </div>
            <div className={styles.tableCell}><Skeleton style={{ width: '60px' }} /></div>
            <div className={styles.tableCell}><Skeleton style={{ width: '60px' }} /></div>
            <div className={styles.tableCell}><Skeleton style={{ width: '50px' }} /></div>
            <div className={styles.tableCell}><Skeleton style={{ width: '90px', height: '1.5rem', borderRadius: 'var(--radius-full)' }} /></div>
          </div>
        ))}
      </div>
    </div>
  </>
);

const PunchRow: React.FC<{ punch: AdminPunch }> = ({ punch }) => {
  const isClockedIn = !punch.clockOutAt;
  const duration = calculateDuration(new Date(punch.clockInAt!), punch.clockOutAt ? new Date(punch.clockOutAt) : null);

  return (
    <div className={styles.tableRow}>
      <div className={styles.tableCell} data-label="Employee">
        <div className={styles.employeeCell}>
          <span className={styles.employeeName}>{punch.fullName || 'Unknown Employee'}</span>
          <span className={styles.employeeCode}>{punch.employeeCode || 'N/A'}</span>
        </div>
      </div>
      <div className={styles.tableCell} data-label="Position">
        <div className={styles.positionCell}>
          <span className={styles.positionName}>{punch.positionName || 'Unassigned'}</span>
          <span className={styles.departmentName}>{punch.departmentName || 'No Department'}</span>
        </div>
      </div>
      <div className={styles.tableCell} data-label="Clock In">
        {punch.clockInAt ? format(new Date(punch.clockInAt), 'p') : '—'}
      </div>
      <div className={styles.tableCell} data-label="Clock Out">
        {punch.clockOutAt ? format(new Date(punch.clockOutAt), 'p') : '—'}
      </div>
      <div className={styles.tableCell} data-label="Hours Worked">
        {duration}
      </div>
      <div className={styles.tableCell} data-label="Status">
        {isClockedIn ? (
          <Badge variant="success">Clocked In</Badge>
        ) : (
          <Badge variant="outline">Clocked Out</Badge>
        )}
      </div>
    </div>
  );
};

export const WorkforceAdmin: React.FC<{ className?: string }> = ({ className }) => {
  const { data, error, isFetching, isError, refetch } = useQuery({
    queryKey: ADMIN_WORKFORCE_PUNCHES_QUERY_KEY,
    queryFn: getAdminWorkforcePunchesToday,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const renderContent = () => {
    if (isFetching && !data) {
      return <WorkforceAdminSkeleton />;
    }

    if (isError) {
      return (
        <div className={styles.stateContainer}>
          <AlertCircle className={styles.errorIcon} />
          <p>Failed to load workforce data.</p>
          <p className={styles.errorMessage}>{error instanceof Error ? error.message : 'An unknown error occurred.'}</p>
          <button onClick={() => refetch()} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      );
    }

    if (!data || data.punches.length === 0) {
      return (
        <>
          <div className={styles.summaryGrid}>
            <SummaryCard
              icon={<Users />}
              title="Total Employees"
              value="0"
              description="Clocked in today"
            />
            <SummaryCard
              icon={<UserCheck />}
              title="Currently Active"
              value="0"
              description="On the clock now"
            />
            <SummaryCard
              icon={<Timer />}
              title="Total Hours"
              value="0.0"
              description="Worked today"
            />
          </div>
          <div className={styles.stateContainer}>
            <Clock className={styles.emptyIcon} />
            <p>No time clock punches recorded for today.</p>
          </div>
        </>
      );
    }

    return (
      <>
        <div className={styles.summaryGrid}>
          <SummaryCard
            icon={<Users />}
            title="Total Employees"
            value={data.summary.totalEmployeesClockedIn}
            description="Clocked in today"
          />
          <SummaryCard
            icon={<UserCheck />}
            title="Currently Active"
            value={data.summary.employeesCurrentlyClockedIn}
            description="On the clock now"
          />
          <SummaryCard
            icon={<Timer />}
            title="Total Hours"
            value={`${data.summary.totalHoursWorked}h`}
            description="Worked today"
          />
        </div>
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div className={styles.headerCell}>Employee</div>
            <div className={styles.headerCell}>Position</div>
            <div className={styles.headerCell}>Clock In</div>
            <div className={styles.headerCell}>Clock Out</div>
            <div className={styles.headerCell}>Hours Worked</div>
            <div className={styles.headerCell}>Status</div>
          </div>
          <div className={styles.tableBody}>
            {data.punches.map((punch) => (
              <PunchRow key={punch.id} punch={punch} />
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Workforce Activity Today</h1>
        {isFetching && <Spinner size="sm" aria-label="Refreshing data" />}
      </div>
      {renderContent()}
    </div>
  );
};