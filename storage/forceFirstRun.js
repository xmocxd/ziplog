import { ALL_ZIPLOG_KEYS } from './keys';

const FRESH_ENV = 'EXPO_PUBLIC_FORCE_FIRST_RUN';
const FRESH_SESSION_ENV = 'EXPO_PUBLIC_ZIPLOG_FRESH_SESSION';

const SESSION_ID_KEY = 'ziplog_fresh_session_id';
const TAB_CLEARED_KEY = 'ziplog_fresh_tab_cleared';
let clearInFlight = null;
let clearedNativeSessionId = null;

export function isForceFirstRunMode() {
  if (!__DEV__) return false;
  const value = process.env[FRESH_ENV];
  return value === '1' || value === 'true';
}

function getFreshSessionId() {
  return process.env[FRESH_SESSION_ENV] || null;
}

function alreadyClearedForCurrentFreshSession() {
  const sessionId = getFreshSessionId();

  if (sessionId) {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(SESSION_ID_KEY) === sessionId;
    }
    return clearedNativeSessionId === sessionId;
  }

  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem(TAB_CLEARED_KEY) === '1';
  }
  return clearedNativeSessionId === 'tab';
}

function markClearedForCurrentFreshSession() {
  const sessionId = getFreshSessionId();

  if (sessionId) {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
      return;
    }
    clearedNativeSessionId = sessionId;
    return;
  }

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(TAB_CLEARED_KEY, '1');
    return;
  }
  clearedNativeSessionId = 'tab';
}

function resetFreshSessionMarkers() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_ID_KEY);
    sessionStorage.removeItem(TAB_CLEARED_KEY);
  }
  clearedNativeSessionId = null;
}

async function clearAllZiplogStorage(AsyncStorage) {
  await AsyncStorage.multiRemove(ALL_ZIPLOG_KEYS);
}

/**
 * Normal web: never clears — data persists across refreshes.
 * web:fresh: clears once per Metro dev run (see :fresh npm scripts), then persists.
 */
export async function prepareStorage() {
  if (!isForceFirstRunMode()) {
    resetFreshSessionMarkers();
    return false;
  }

  if (alreadyClearedForCurrentFreshSession()) {
    return false;
  }

  if (!clearInFlight) {
    clearInFlight = (async () => {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      await clearAllZiplogStorage(AsyncStorage);
      markClearedForCurrentFreshSession();
    })().finally(() => {
      clearInFlight = null;
    });
  }

  await clearInFlight;
  return true;
}

export async function runForceFirstRunClear() {
  return prepareStorage();
}
