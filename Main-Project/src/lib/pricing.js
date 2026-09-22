/**
 * pricing.js — Ticket pricing from view score
 * Formula extracted from CINEMAVIEW: price = base × (minMul + score/100 × scoreMul)
 */

/**
 * @param {number} score - view quality score 0–100
 * @param {{ basePrice: number, minMultiplier: number, scoreMultiplier: number }} config
 * @returns {number} price in INR (rounded)
 */
export function calculatePrice(score, config) {
  return Math.round(
    config.basePrice * (config.minMultiplier + (score / 100) * config.scoreMultiplier)
  );
}

/**
 * Format an INR amount with locale-aware separators.
 * @param {number} amount
 * @returns {string} e.g. "₹1,450"
 */
const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatINR(amount) {
  return inrFormatter.format(amount);
}

/**
 * Get tier label from score.
 * @param {number} score
 * @returns {'prime' | 'standard' | 'side'}
 */
export function getTier(score) {
  if (score >= 80) return 'prime';
  if (score >= 55) return 'standard';
  return 'side';
}

/**
 * Tier display info
 */
export const TIERS = {
  prime: { label: 'Prime', color: '#2ecc71', range: '80–100' },
  standard: { label: 'Standard', color: '#f1c40f', range: '55–79' },
  side: { label: 'Side', color: '#e74c3c', range: '0–54' },
};
