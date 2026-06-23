import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  INITIALIZED: '@ziplog/initialized',
  LOCATIONS: '@ziplog/locations',
  READY_TIME_OFFSET_MINUTES: '@ziplog/readyTimeOffsetMinutes',
  BUFFER_TIME_MINUTES: '@ziplog/bufferTimeMinutes',
  RUSH_HOUR_PEAK_START: '@ziplog/rushHourPeakStart',
  RUSH_HOUR_PEAK_END: '@ziplog/rushHourPeakEnd',
};

const DEFAULT_RUSH_HOUR_MINUTES = 60;
const DEFAULT_READY_TIME_MINUTES = 30;
const DEFAULT_BUFFER_TIME_MINUTES = 10;
const DEFAULT_RUSH_HOUR_PEAK_START = '07:00';
const DEFAULT_RUSH_HOUR_PEAK_END = '10:00';

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function defaultLocations() {
  return [
    { id: createId(), name: 'Metro', rushHourAllowanceMinutes: 60 },
    { id: createId(), name: 'Non-Metro', rushHourAllowanceMinutes: 15 },
    { id: createId(), name: 'No Traffic', rushHourAllowanceMinutes: 0 },
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

export async function loadAppData() {
  const initialized = await AsyncStorage.getItem(KEYS.INITIALIZED);
  let locations = await readJson(KEYS.LOCATIONS, []);

  if (initialized !== 'true') {
    locations = defaultLocations();
    await AsyncStorage.setItem(KEYS.LOCATIONS, JSON.stringify(locations));
    await AsyncStorage.setItem(KEYS.INITIALIZED, 'true');
  }

  const offsetRaw = await AsyncStorage.getItem(KEYS.READY_TIME_OFFSET_MINUTES);
  let readyTimeOffsetMinutes = Number.parseInt(offsetRaw ?? '', 10);
  if (Number.isNaN(readyTimeOffsetMinutes) || readyTimeOffsetMinutes <= 0) {
    readyTimeOffsetMinutes = DEFAULT_READY_TIME_MINUTES;
    await AsyncStorage.setItem(KEYS.READY_TIME_OFFSET_MINUTES, String(readyTimeOffsetMinutes));
  }

  const bufferRaw = await AsyncStorage.getItem(KEYS.BUFFER_TIME_MINUTES);
  let bufferTimeMinutes = Number.parseInt(bufferRaw ?? '', 10);
  if (Number.isNaN(bufferTimeMinutes) || bufferTimeMinutes < 0) {
    bufferTimeMinutes = DEFAULT_BUFFER_TIME_MINUTES;
    await AsyncStorage.setItem(KEYS.BUFFER_TIME_MINUTES, String(bufferTimeMinutes));
  }

  let rushHourPeakStart = await AsyncStorage.getItem(KEYS.RUSH_HOUR_PEAK_START);
  let rushHourPeakEnd = await AsyncStorage.getItem(KEYS.RUSH_HOUR_PEAK_END);
  if (!rushHourPeakStart || !rushHourPeakEnd) {
    rushHourPeakStart = DEFAULT_RUSH_HOUR_PEAK_START;
    rushHourPeakEnd = DEFAULT_RUSH_HOUR_PEAK_END;
    await AsyncStorage.setItem(KEYS.RUSH_HOUR_PEAK_START, rushHourPeakStart);
    await AsyncStorage.setItem(KEYS.RUSH_HOUR_PEAK_END, rushHourPeakEnd);
  }

  return { locations, readyTimeOffsetMinutes, bufferTimeMinutes, rushHourPeakStart, rushHourPeakEnd };
}

export async function saveLocations(locations) {
  await AsyncStorage.setItem(KEYS.LOCATIONS, JSON.stringify(locations));
  return locations;
}

export function createLocation({ name, rushHourAllowanceMinutes = DEFAULT_RUSH_HOUR_MINUTES }) {
  return { id: createId(), name: name.trim(), rushHourAllowanceMinutes };
}

export async function upsertLocation(location) {
  const locations = await readJson(KEYS.LOCATIONS, []);
  const index = locations.findIndex((item) => item.id === location.id);
  if (index === -1) locations.push(location);
  else locations[index] = location;
  return saveLocations(locations);
}

export async function saveReadyTimeOffsetMinutes(minutes) {
  await AsyncStorage.setItem(KEYS.READY_TIME_OFFSET_MINUTES, String(minutes));
  return minutes;
}

export async function saveBufferTimeMinutes(minutes) {
  await AsyncStorage.setItem(KEYS.BUFFER_TIME_MINUTES, String(minutes));
  return minutes;
}

export async function saveRushHourPeakTimes(start, end) {
  await AsyncStorage.setItem(KEYS.RUSH_HOUR_PEAK_START, start);
  await AsyncStorage.setItem(KEYS.RUSH_HOUR_PEAK_END, end);
  return { rushHourPeakStart: start, rushHourPeakEnd: end };
}
