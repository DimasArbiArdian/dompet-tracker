const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const MONTH_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

/**
 * Format ISO date string or Date to Indonesian readable format (e.g. 19 Okt 2026)
 * @param {string|Date} dateInput
 * @param {boolean} withTime
 * @returns {string}
 */
export const formatDateID = (dateInput, withTime = false) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const month = MONTH_SHORT_ID[d.getMonth()];
  const year = d.getFullYear();

  if (withTime) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  }

  return `${day} ${month} ${year}`;
};

/**
 * Returns input value format for date inputs: YYYY-MM-DD
 * @param {Date|string} dateInput
 * @returns {string}
 */
export const toInputDateFormat = (dateInput = new Date()) => {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get human readable month and year (e.g., Oktober 2026)
 * @param {number} month (1-12)
 * @param {number} year
 * @returns {string}
 */
export const formatMonthYear = (month, year) => {
  const mIndex = Math.max(0, Math.min(11, (month || 1) - 1));
  return `${MONTH_NAMES_ID[mIndex]} ${year}`;
};

export { MONTH_NAMES_ID, MONTH_SHORT_ID };
