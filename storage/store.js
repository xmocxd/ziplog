import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from './keys';
import { createId, readJson } from './shared';

const DEFAULT_RUSH_HOUR_MINUTES = 60;
const DEFAULT_READY_TIME_MINUTES = 30;
const DEFAULT_BUFFER_TIME_MINUTES = 10;
const DEFAULT_RUSH_HOUR_PEAK_START = '07:00';
const DEFAULT_RUSH_HOUR_PEAK_END = '10:00';

function defaultLocations() {
  return [
    { id: createId(), name: 'Metro', rushHourAllowanceMinutes: 60 },
    { id: createId(), name: 'Non-Metro', rushHourAllowanceMinutes: 15 },
    { id: createId(), name: 'No Traffic', rushHourAllowanceMinutes: 0 },
  ];
}

export async function loadAppData() {
  const initialized = await AsyncStorage.getItem(STORAGE_KEYS.initialized);
  let locations = await readJson(STORAGE_KEYS.locations, []);

  if (initialized !== 'true') {
    locations = defaultLocations();
    await AsyncStorage.setItem(STORAGE_KEYS.locations, JSON.stringify(locations));
    await AsyncStorage.setItem(STORAGE_KEYS.initialized, 'true');
  }

  const offsetRaw = await AsyncStorage.getItem(STORAGE_KEYS.readyTimeOffsetMinutes);
  let readyTimeOffsetMinutes = Number.parseInt(offsetRaw ?? '', 10);
  if (Number.isNaN(readyTimeOffsetMinutes) || readyTimeOffsetMinutes <= 0) {
    readyTimeOffsetMinutes = DEFAULT_READY_TIME_MINUTES;
    await AsyncStorage.setItem(STORAGE_KEYS.readyTimeOffsetMinutes, String(readyTimeOffsetMinutes));
  }

  const bufferRaw = await AsyncStorage.getItem(STORAGE_KEYS.bufferTimeMinutes);
  let bufferTimeMinutes = Number.parseInt(bufferRaw ?? '', 10);
  if (Number.isNaN(bufferTimeMinutes) || bufferTimeMinutes < 0) {
    bufferTimeMinutes = DEFAULT_BUFFER_TIME_MINUTES;
    await AsyncStorage.setItem(STORAGE_KEYS.bufferTimeMinutes, String(bufferTimeMinutes));
  }

  let rushHourPeakStart = await AsyncStorage.getItem(STORAGE_KEYS.rushHourPeakStart);
  let rushHourPeakEnd = await AsyncStorage.getItem(STORAGE_KEYS.rushHourPeakEnd);
  if (!rushHourPeakStart || !rushHourPeakEnd) {
    rushHourPeakStart = DEFAULT_RUSH_HOUR_PEAK_START;
    rushHourPeakEnd = DEFAULT_RUSH_HOUR_PEAK_END;
    await AsyncStorage.setItem(STORAGE_KEYS.rushHourPeakStart, rushHourPeakStart);
    await AsyncStorage.setItem(STORAGE_KEYS.rushHourPeakEnd, rushHourPeakEnd);
  }

  return { locations, readyTimeOffsetMinutes, bufferTimeMinutes, rushHourPeakStart, rushHourPeakEnd };
}

export async function saveLocations(locations) {
  await AsyncStorage.setItem(STORAGE_KEYS.locations, JSON.stringify(locations));
  return locations;
}

export function createLocation({ name, rushHourAllowanceMinutes = DEFAULT_RUSH_HOUR_MINUTES }) {
  return { id: createId(), name: name.trim(), rushHourAllowanceMinutes };
}

export async function upsertLocation(location) {
  const locations = await readJson(STORAGE_KEYS.locations, []);
  const index = locations.findIndex((item) => item.id === location.id);
  if (index === -1) locations.push(location);
  else locations[index] = location;
  return saveLocations(locations);
}

export async function saveReadyTimeOffsetMinutes(minutes) {
  await AsyncStorage.setItem(STORAGE_KEYS.readyTimeOffsetMinutes, String(minutes));
  return minutes;
}

export async function saveBufferTimeMinutes(minutes) {
  await AsyncStorage.setItem(STORAGE_KEYS.bufferTimeMinutes, String(minutes));
  return minutes;
}

export async function saveRushHourPeakTimes(start, end) {
  await AsyncStorage.setItem(STORAGE_KEYS.rushHourPeakStart, start);
  await AsyncStorage.setItem(STORAGE_KEYS.rushHourPeakEnd, end);
  return { rushHourPeakStart: start, rushHourPeakEnd: end };
}
