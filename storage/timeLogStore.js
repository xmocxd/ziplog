import AsyncStorage from '@react-native-async-storage/async-storage';

import { colorForTaskIndex } from '../utils/taskColors';

const KEYS = {
  TASK_TYPES: '@ziplog/taskTypes',
  TIME_LOG_ENTRIES: '@ziplog/timeLogEntries',
};

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function defaultTaskTypes() {
  return [
    { id: 'work', name: 'Work', color: colorForTaskIndex(0) },
    { id: 'drive', name: 'Drive', color: colorForTaskIndex(1) },
  ];
}

async function readJson(key, fallback) {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function loadTimeLogData() {
  let taskTypes = await readJson(KEYS.TASK_TYPES, null);
  if (!taskTypes?.length) {
    taskTypes = defaultTaskTypes();
    await AsyncStorage.setItem(KEYS.TASK_TYPES, JSON.stringify(taskTypes));
  }

  const entries = await readJson(KEYS.TIME_LOG_ENTRIES, []);
  return { taskTypes, entries };
}

async function saveEntries(entries) {
  const payload = JSON.stringify(entries);
  await AsyncStorage.setItem(KEYS.TIME_LOG_ENTRIES, payload);

  if (__DEV__) {
    const saved = await AsyncStorage.getItem(KEYS.TIME_LOG_ENTRIES);
    if (saved !== payload) {
      throw new Error('Time log entries failed to persist to storage');
    }
  }

  return entries;
}

export function createTimeLogEntry({
  taskTypeId,
  name,
  startTime,
  endTime = null,
  isManualBlock = false,
}) {
  const now = new Date().toISOString();
  return {
    id: createId(),
    taskTypeId,
    name,
    startTime: startTime instanceof Date ? startTime.toISOString() : startTime,
    endTime: endTime instanceof Date ? endTime.toISOString() : endTime,
    createdAt: now,
    adjustedMinutes: 0,
    isManualBlock,
  };
}

export async function saveTimeLogEntries(entries) {
  return saveEntries(entries);
}

export async function saveTaskTypes(taskTypes) {
  await AsyncStorage.setItem(KEYS.TASK_TYPES, JSON.stringify(taskTypes));
  return taskTypes;
}
