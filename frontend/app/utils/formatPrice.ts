/**
 * Format price according to amount:
 * - Under 1000: show 2 decimals (10.00, 100.00)
 * - 1000 and above: show commas, no decimals (1,000, 10,000, 100,000)
 */
export function formatPrice(price: number): string {
  if (price < 1000) {
    return price.toFixed(2);
  }
  
  return Math.floor(price).toLocaleString('en-US');
}
