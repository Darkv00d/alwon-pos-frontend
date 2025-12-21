/**
 * Maps category names to emojis for visual display in the kiosk interface.
 * Performs case-insensitive matching with support for Spanish and English terms.
 */
export function getCategoryIcon(categoryName: string | null): string {
  if (!categoryName) return '📦';
  
  const normalized = categoryName.toLowerCase();
  
  if (normalized.includes('fruta') || normalized.includes('fruit')) return '🍎';
  if (normalized.includes('bebida') || normalized.includes('beverage') || normalized.includes('drink')) return '🥤';
  if (normalized.includes('snack')) return '🍪';
  if (normalized.includes('lácteo') || normalized.includes('lacteo') || normalized.includes('dairy')) return '🥛';
  if (normalized.includes('panadería') || normalized.includes('panaderia') || normalized.includes('bakery') || normalized.includes('pan')) return '🥖';
  if (normalized.includes('limpieza') || normalized.includes('cleaning')) return '🧼';
  if (normalized.includes('cuidado personal') || normalized.includes('personal care') || normalized.includes('higiene')) return '🧴';
  if (normalized.includes('carne') || normalized.includes('meat')) return '🥩';
  if (normalized.includes('verdura') || normalized.includes('vegetable') || normalized.includes('vegetal')) return '🥬';
  
  return '📦';
}