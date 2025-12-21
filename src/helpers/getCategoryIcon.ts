// Temporary stub for missing helper
export function getCategoryIcon(categoryId: number): string {
    const icons: Record<number, string> = {
        1: '🥛', 2: '🍞', 3: '🥩', 4: '🥗', 5: '🍫',
    };
    return icons[categoryId] || '📦';
}
