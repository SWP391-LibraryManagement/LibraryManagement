const BUSINESS_TIME_ZONE = 'Asia/Ho_Chi_Minh';
// Vietnam has used UTC+07:00 year-round since 1975, so current library dates
// have a deterministic UTC interval without daylight-saving transitions.
const BUSINESS_UTC_OFFSET_MINUTES = 7 * 60;

function businessDateParts(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [year, month, day] = value.trim().split('-').map(Number);
    return { year, month, day };
  }
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(value)).map((part) => [part.type, Number(part.value)]));
  return { year: parts.year, month: parts.month, day: parts.day };
}

function overdueDaysBetween(dueDate, referenceDate) {
  const due = businessDateParts(dueDate);
  const reference = businessDateParts(referenceDate);
  const dueEpoch = Date.UTC(due.year, due.month - 1, due.day);
  const referenceEpoch = Date.UTC(reference.year, reference.month - 1, reference.day);
  return Math.max(0, Math.floor((referenceEpoch - dueEpoch) / 86400000));
}

function formatBusinessDate(value) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${fields.year}-${fields.month}-${fields.day}`;
}

function businessDateUtcBounds(value) {
  const { year, month, day } = businessDateParts(value);
  const startEpoch =
    Date.UTC(year, month - 1, day) - BUSINESS_UTC_OFFSET_MINUTES * 60 * 1000;

  return {
    start: new Date(startEpoch),
    end: new Date(startEpoch + 86400000),
  };
}

function addBusinessDays(dateOnly, days) {
  const date = new Date(`${dateOnly}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function compareBusinessDates(left, right) {
  return String(left).localeCompare(String(right));
}

module.exports = {
  BUSINESS_TIME_ZONE,
  overdueDaysBetween,
  formatBusinessDate,
  businessDateUtcBounds,
  addBusinessDays,
  compareBusinessDates,
};
