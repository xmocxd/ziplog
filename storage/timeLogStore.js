import AsyncStorage from '@react-native-async-storage/async-storage';

import { colorForTaskIndex } from '../utils/taskColors';
import { STORAGE_KEYS } from './keys';
import { createId, readJson } from './shared';

export function defaultTaskTypes() {
  return [
    { id: 'work', name: 'Work', color: colorForTaskIndex(0) },
    { id: 'drive', name: 'Drive', color: colorForTaskIndex(1) },
  ];
}

export async function loadTimeLogData() {
  let taskTypes = await readJson(STORAGE_KEYS.taskTypes, null);
  if (!taskTypes?.length) {
    taskTypes = defaultTaskTypes();
    await AsyncStorage.setItem(STORAGE_KEYS.taskTypes, JSON.stringify(taskTypes));
  }

  const entries = await readJson(STORAGE_KEYS.timeLogEntries, []);
  return { taskTypes, entries };
}

async function saveEntries(entries) {
  const payload = JSON.stringify(entries);
  await AsyncStorage.setItem(STORAGE_KEYS.timeLogEntries, payload);

  if (__DEV__) {
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.timeLogEntries);
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
  isLiveTimer = false,
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
    isLiveTimer,
  };
}

export async function saveTimeLogEntries(entries) {
  return saveEntries(entries);
}

export async function saveTaskTypes(taskTypes) {
  await AsyncStorage.setItem(STORAGE_KEYS.taskTypes, JSON.stringify(taskTypes));
  return taskTypes;
}
