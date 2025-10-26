const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
};

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DATE_OPTIONS,
  hour: '2-digit',
  minute: '2-digit'
};

function toDate(value: string | number | Date) {
  if (value instanceof Date) {
    return value;
  }
  return new Date(value);
}

export function formatDate(value: string | number | Date) {
  const date = toDate(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ru-RU', DATE_OPTIONS);
}

export function formatDateTime(value: string | number | Date) {
  const date = toDate(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('ru-RU', DATE_TIME_OPTIONS);
}
