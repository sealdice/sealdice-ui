import dayjs from 'dayjs';

export type TimeValue = string | number | null | undefined;

const SECOND_TIMESTAMP_THRESHOLD = 9999999999;

export const normalizeTimeValue = (value: TimeValue) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const numericValue = Number(trimmed);
    if (!Number.isNaN(numericValue)) {
      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        return null;
      }
      return numericValue > SECOND_TIMESTAMP_THRESHOLD ? numericValue : numericValue * 1000;
    }

    return trimmed;
  }

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value > SECOND_TIMESTAMP_THRESHOLD ? value : value * 1000;
};

export const formatTime = (value: TimeValue) => {
  const normalized = normalizeTimeValue(value);
  if (normalized === null) {
    return '-';
  }

  const parsed = dayjs(normalized);
  if (!parsed.isValid()) {
    return '-';
  }

  return parsed.format('YYYY-MM-DD HH:mm:ss');
};

export const getTimeTimestamp = (value: TimeValue) => {
  const normalized = normalizeTimeValue(value);
  if (normalized === null) {
    return 0;
  }

  const parsed = dayjs(normalized);
  if (!parsed.isValid()) {
    return 0;
  }

  return parsed.valueOf();
};
