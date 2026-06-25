import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { isWebIOS } from '../utils/platform';

export const BACKUP_VERSION = 1;

const STORAGE_KEYS = {
  initialized: '@ziplog/initialized',
  locations: '@ziplog/locations',
  readyTimeOffsetMinutes: '@ziplog/readyTimeOffsetMinutes',
  bufferTimeMinutes: '@ziplog/bufferTimeMinutes',
  rushHourPeakStart: '@ziplog/rushHourPeakStart',
  rushHourPeakEnd: '@ziplog/rushHourPeakEnd',
  taskTypes: '@ziplog/taskTypes',
  timeLogEntries: '@ziplog/timeLogEntries',
};

function validateBackup(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid backup file');
  }
  if (data.version !== BACKUP_VERSION) {
    throw new Error('Unsupported backup version');
  }
  if (!Array.isArray(data.locations)) throw new Error('Invalid locations in backup');
  if (!Array.isArray(data.taskTypes)) throw new Error('Invalid task types in backup');
  if (!Array.isArray(data.timeLogEntries)) throw new Error('Invalid time log in backup');
}

export async function exportAllData() {
  const pairs = await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));
  const map = Object.fromEntries(pairs);

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    initialized: map[STORAGE_KEYS.initialized] ?? 'true',
    locations: map[STORAGE_KEYS.locations] ? JSON.parse(map[STORAGE_KEYS.locations]) : [],
    readyTimeOffsetMinutes: Number.parseInt(map[STORAGE_KEYS.readyTimeOffsetMinutes] ?? '30', 10),
    bufferTimeMinutes: Number.parseInt(map[STORAGE_KEYS.bufferTimeMinutes] ?? '10', 10),
    rushHourPeakStart: map[STORAGE_KEYS.rushHourPeakStart] ?? '07:00',
    rushHourPeakEnd: map[STORAGE_KEYS.rushHourPeakEnd] ?? '10:00',
    taskTypes: map[STORAGE_KEYS.taskTypes] ? JSON.parse(map[STORAGE_KEYS.taskTypes]) : [],
    timeLogEntries: map[STORAGE_KEYS.timeLogEntries]
      ? JSON.parse(map[STORAGE_KEYS.timeLogEntries])
      : [],
  };
}

export async function importAllData(backup) {
  validateBackup(backup);

  await AsyncStorage.multiSet([
    [STORAGE_KEYS.initialized, backup.initialized ?? 'true'],
    [STORAGE_KEYS.locations, JSON.stringify(backup.locations)],
    [STORAGE_KEYS.readyTimeOffsetMinutes, String(backup.readyTimeOffsetMinutes)],
    [STORAGE_KEYS.bufferTimeMinutes, String(backup.bufferTimeMinutes)],
    [STORAGE_KEYS.rushHourPeakStart, backup.rushHourPeakStart],
    [STORAGE_KEYS.rushHourPeakEnd, backup.rushHourPeakEnd],
    [STORAGE_KEYS.taskTypes, JSON.stringify(backup.taskTypes)],
    [STORAGE_KEYS.timeLogEntries, JSON.stringify(backup.timeLogEntries)],
  ]);
}

export function buildBackupFilename() {
  return `ziplog-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function shareOrDownloadBackup(data) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return { ok: false, reason: 'unsupported' };
  }

  const json = JSON.stringify(data, null, 2);
  const filename = buildBackupFilename();
  const blob = new Blob([json], { type: 'application/json' });

  // Web Share with files works on iOS (Save to Files). Desktop Chrome throws NotAllowedError.
  if (isWebIOS() && navigator.share) {
    const file = new File([blob], filename, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'ziplog backup' });
        return { ok: true, method: 'share' };
      } catch (error) {
        if (error?.name === 'AbortError') {
          return { ok: false, reason: 'cancelled' };
        }
        console.warn('Web Share failed, falling back to download:', error);
      }
    }
  }

  downloadBlob(blob, filename);
  return { ok: true, method: 'download' };
}

export function pickBackupFile() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return Promise.resolve({ ok: false, reason: 'unsupported' });
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve({ ok: false, reason: 'cancelled' });
        return;
      }
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        resolve({ ok: true, data });
      } catch {
        resolve({ ok: false, reason: 'invalid' });
      }
    };

    input.oncancel = () => resolve({ ok: false, reason: 'cancelled' });
    input.click();
  });
}
