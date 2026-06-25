import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from './keys';

export async function loadSettings() {
  const lastBackupAt = await AsyncStorage.getItem(STORAGE_KEYS.lastBackupAt);
  return { lastBackupAt: lastBackupAt || null };
}

export async function saveLastBackupAt(isoTimestamp) {
  if (isoTimestamp) {
    await AsyncStorage.setItem(STORAGE_KEYS.lastBackupAt, isoTimestamp);
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.lastBackupAt);
  }
}
