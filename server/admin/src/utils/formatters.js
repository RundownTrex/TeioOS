/**
 * Formatting helpers for the TeioOS Administration Dashboard.
 * All backend datetimes arrive as UTC ISO-8601 strings and are rendered in local time.
 */

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (value) => {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : '—';
};

export const formatTime = (value) => {
  const date = toDate(value);
  return date ? timeFormatter.format(date) : '—';
};

export const formatDateTime = (value) => {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : '—';
};

export const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return numberFormatter.format(Number(value));
};

export const formatMarks = (value) => formatNumber(value);

export const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${numberFormatter.format(Number(value))}%`;
};

/**
 * Compact relative time ("just now", "5m ago", "2h ago", "3d ago").
 * Falls back to a plain date beyond 7 days. Future timestamps render as
 * their plain date/time to avoid misleading "ago" labels.
 */
export const formatRelativeTime = (value) => {
  const date = toDate(value);
  if (!date) return '—';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 0) return formatDateTime(value);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
};
