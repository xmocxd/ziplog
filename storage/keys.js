// All localStorage / AsyncStorage keys used by ziplog.
export const STORAGE_KEYS = {
  initialized: '@ziplog/initialized',
  locations: '@ziplog/locations',
  readyTimeOffsetMinutes: '@ziplog/readyTimeOffsetMinutes',
  bufferTimeMinutes: '@ziplog/bufferTimeMinutes',
  rushHourPeakStart: '@ziplog/rushHourPeakStart',
  rushHourPeakEnd: '@ziplog/rushHourPeakEnd',
  taskTypes: '@ziplog/taskTypes',
  timeLogEntries: '@ziplog/timeLogEntries',
  lastBackupAt: '@ziplog/lastBackupAt',
  autoBackupEnabled: '@ziplog/autoBackupEnabled',
};

export const ALL_ZIPLOG_KEYS = Object.values(STORAGE_KEYS);
