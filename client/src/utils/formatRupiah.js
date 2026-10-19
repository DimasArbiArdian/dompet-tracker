/**
 * Format numeric value to Indonesian Rupiah (IDR)
 * @param {number|string} amount
 * @param {boolean} withPrefix - include 'Rp ' prefix
 * @returns {string}
 */
export const formatRupiah = (amount, withPrefix = true) => {
  const num = Number(amount) || 0;
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(num);

  return withPrefix ? `Rp ${formatted}` : formatted;
};

/**
 * Format large numbers to compact human-readable format (e.g., 2.5 Jt, 1.2 M)
 * @param {number} amount
 * @returns {string}
 */
export const formatCompactRupiah = (amount) => {
  const num = Number(amount) || 0;
  if (Math.abs(num) >= 1_000_000_000) {
    return `Rp ${(num / 1_000_000_000).toFixed(1)} M`;
  }
  if (Math.abs(num) >= 1_000_000) {
    return `Rp ${(num / 1_000_000).toFixed(1)} Jt`;
  }
  if (Math.abs(num) >= 1_000) {
    return `Rp ${(num / 1_000).toFixed(0)} Rb`;
  }
  return formatRupiah(num);
};

/**
 * Parse a raw string with dots or commas into a clean number
 * @param {string} value
 * @returns {number}
 */
export const parseRupiahInput = (value) => {
  if (!value) return 0;
  const cleaned = value.toString().replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
};
