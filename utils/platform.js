import { Platform } from 'react-native';

export function isWebIOS() {
  if (Platform.OS !== 'web') return false;
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}
