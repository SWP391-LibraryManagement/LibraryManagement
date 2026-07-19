import { VI_COPY } from '../i18n/vi.js';

function normalizeDisplayKey(value) {
  return String(value || '')
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
}

export function getRoleLabel(value) {
  return VI_COPY.roles[normalizeDisplayKey(value)] || VI_COPY.common.unknownRole;
}

export function getStatusLabel(value) {
  return VI_COPY.statuses[normalizeDisplayKey(value)] || VI_COPY.common.unknownStatus;
}

export function getBooleanLabel(value) {
  return value ? VI_COPY.common.yes : VI_COPY.common.no;
}
