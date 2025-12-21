import { format, formatDistance, formatRelative } from 'date-fns';
import { es } from 'date-fns/locale';

// Date utilities
export function formatDate(date: Date | string, pattern: string = 'PP'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, pattern, { locale: es });
}

export function formatDateTime(date: Date | string): string {
    return formatDate(date, 'PPpp');
}

export function formatTimeAgo(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistance(dateObj, new Date(), { addSuffix: true, locale: es });
}

export function formatRelativeDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatRelative(dateObj, new Date(), { locale: es });
}
