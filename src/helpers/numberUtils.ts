// Number utilities
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    }).format(value);
}

export function formatInteger(value: number): string {
    return new Intl.NumberFormat('es-CO').format(value);
}

export function formatDecimal(value: number, decimals: number = 2): string {
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}
