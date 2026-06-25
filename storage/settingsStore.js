import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_BACKUP_AT_KEY = '@ziplog/lastBackupAt';

export async function loadSettings() {
  const lastBackupAt = await AsyncStorage.getItem(LAST_BACKUP_AT_KEY);
  return { lastBackupAt: lastBackupAt || null };
}

export async function saveLastBackupAt(isoTimestamp) {
  if (isoTimestamp) {
    await AsyncStorage.setItem(LAST_BACKUP_AT_KEY, isoTimestamp);
  } else {
    await AsyncStorage.removeItem(LAST_BACKUP_AT_KEY);
  }
}
