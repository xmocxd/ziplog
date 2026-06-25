import AsyncStorage from '@react-native-async-storage/async-storage';

import { isWebIOS } from '../utils/platform';
import { STORAGE_KEYS } from './keys';
import { loadSettings, saveLastBackupAt } from './settingsStore';
import { parseJsonArray } from './shared';

export const BACKUP_VERSION = 1;

const BACKUP_DATA_KEYS = [
  STORAGE_KEYS.initialized,
  STORAGE_KEYS.locations,
  STORAGE_KEYS.readyTimeOffsetMinutes,
  STORAGE_KEYS.bufferTimeMinutes,
  STORAGE_KEYS.rushHourPeakStart,
  STORAGE_KEYS.rushHourPeakEnd,
  STORAGE_KEYS.taskTypes,
  STORAGE_KEYS.timeLogEntries,
];

function validateBackup(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid backup file');
  if (data.version !== BACKUP_VERSION) throw new Error('Unsupported backup version');
  if (!Array.isArray(data.locations)) throw new Error('Invalid locations in backup');
  if (!Array.isArray(data.taskTypes)) throw new Error('Invalid task types in backup');
  if (!Array.isArray(data.timeLogEntries)) throw new Error('Invalid time log in backup');
}

export async function exportAllData() {
  const pairs = await AsyncStorage.multiGet(BACKUP_DATA_KEYS);
  const map = Object.fromEntries(pairs);
  const { lastBackupAt } = await loadSettings();

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    initialized: map[STORAGE_KEYS.initialized] ?? 'true',
    locations: parseJsonArray(map[STORAGE_KEYS.locations], 'locations'),
    readyTimeOffsetMinutes: Number.parseInt(map[STORAGE_KEYS.readyTimeOffsetMinutes] ?? '30', 10),
    bufferTimeMinutes: Number.parseInt(map[STORAGE_KEYS.bufferTimeMinutes] ?? '10', 10),
    rushHourPeakStart: map[STORAGE_KEYS.rushHourPeakStart] ?? '07:00',
    rushHourPeakEnd: map[STORAGE_KEYS.rushHourPeakEnd] ?? '10:00',
    taskTypes: parseJsonArray(map[STORAGE_KEYS.taskTypes], 'task types'),
    timeLogEntries: parseJsonArray(map[STORAGE_KEYS.timeLogEntries], 'time log'),
    lastBackupAt,
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

  if (backup.lastBackupAt !== undefined) {
    await saveLastBackupAt(backup.lastBackupAt);
  }
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
  if (typeof document === 'undefined') {
    return { ok: false, reason: 'unsupported' };
  }

  const json = JSON.stringify(data, null, 2);
  const filename = buildBackupFilename();
  const blob = new Blob([json], { type: 'application/json' });

  if (isWebIOS() && navigator.share) {
    const file = new File([blob], filename, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'ziplog backup' });
        return { ok: true, method: 'share' };
      } catch (error) {
        if (error?.name === 'AbortError') return { ok: false, reason: 'cancelled' };
        console.warn('Web Share failed, falling back to download:', error);
      }
    }
  }

  downloadBlob(blob, filename);
  return { ok: true, method: 'download' };
}

export function pickBackupFile() {
  if (typeof document === 'undefined') {
    return Promise.resolve({ ok: false, reason: 'unsupported' });
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    let settled = false;

    function finish(result) {
      if (settled) return;
      settled = true;
      window.removeEventListener('focus', onWindowFocus);
      resolve(result);
    }

    function onWindowFocus() {
      setTimeout(() => {
        if (!input.files?.length) finish({ ok: false, reason: 'cancelled' });
      }, 400);
    }

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        finish({ ok: false, reason: 'cancelled' });
        return;
      }
      try {
        const data = JSON.parse(await file.text());
        finish({ ok: true, data });
      } catch {
        finish({ ok: false, reason: 'invalid' });
      }
    };

    input.oncancel = () => finish({ ok: false, reason: 'cancelled' });
    window.addEventListener('focus', onWindowFocus);
    input.click();
  });
}
