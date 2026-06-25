export async function requestPersistentStorage() {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return { ok: false, reason: 'unsupported' };
  }

  try {
    if (await navigator.storage.persisted?.()) {
      return { ok: true, persisted: true, already: true };
    }
    const granted = await navigator.storage.persist();
    return { ok: true, persisted: granted, already: false };
  } catch (error) {
    console.warn('Persistent storage request failed:', error);
    return { ok: false, reason: 'error' };
  }
}

export async function getPersistentStorageStatus() {
  if (typeof navigator === 'undefined' || !navigator.storage?.persisted) {
    return 'unsupported';
  }

  try {
    const persisted = await navigator.storage.persisted();
    return persisted ? 'on' : 'off';
  } catch {
    return 'unsupported';
  }
}
