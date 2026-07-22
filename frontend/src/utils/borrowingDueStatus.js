const DAY_MS = 24 * 60 * 60 * 1000;
const LIBRARY_TIME_ZONE = 'Asia/Ho_Chi_Minh';

function datePartsToEpoch({ year, month, day }) {
  return Date.UTC(Number(year), Number(month) - 1, Number(day));
}

function parseDateOnly(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, year, month, day] = match;
  const epoch = datePartsToEpoch({ year, month, day });
  const parsed = new Date(epoch);
  if (
    parsed.getUTCFullYear() !== Number(year)
    || parsed.getUTCMonth() + 1 !== Number(month)
    || parsed.getUTCDate() !== Number(day)
  ) return null;
  return epoch;
}

function businessDateEpoch(now) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: LIBRARY_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now).filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, value]),
  );
  return datePartsToEpoch(parts);
}

// @spec FR-FE07-031 - derive an explicit due state from Asia/Ho_Chi_Minh business dates.
export function getBorrowDueStatus(dueDate, now = new Date()) {
  const dueEpoch = parseDateOnly(dueDate);
  if (dueEpoch === null) return { state: 'UNKNOWN', days: null, label: 'Chưa có hạn trả' };

  const difference = Math.round((dueEpoch - businessDateEpoch(now)) / DAY_MS);
  if (difference < 0) {
    const days = Math.abs(difference);
    return { state: 'OVERDUE', days, label: `Quá hạn ${days} ngày` };
  }
  if (difference === 0) return { state: 'DUE_TODAY', days: 0, label: 'Đến hạn hôm nay' };
  return { state: 'UPCOMING', days: difference, label: `Còn ${difference} ngày` };
}

