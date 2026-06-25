import { useEffect, useRef, useState } from 'react';

import { exportAllData, importAllData, pickBackupFile, shareOrDownloadBackup } from '../storage/backup';
import { loadSettings, saveLastBackupAt } from '../storage/settingsStore';
import { confirmAction, showAlert } from '../utils/dialogs';

export function useBackup({ reloadAppData, reloadTimeLog }) {
  const [lastBackupAt, setLastBackupAt] = useState(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    loadSettings()
      .then((settings) => setLastBackupAt(settings.lastBackupAt))
      .catch((error) => console.error('Failed to load settings:', error));
  }, []);

  async function backupNow() {
    if (inFlight.current) return;
    inFlight.current = true;

    try {
      const data = await exportAllData();
      setBusy(true);
      const result = await shareOrDownloadBackup(data);

      if (result.ok) {
        const timestamp = new Date().toISOString();
        await saveLastBackupAt(timestamp);
        setLastBackupAt(timestamp);
      } else if (result.reason !== 'cancelled') {
        showAlert('Backup failed', 'Could not save the backup file. Try again.');
      }
    } catch (error) {
      console.error('Backup failed:', error);
      showAlert('Backup failed', error.message || 'Could not save the backup file. Try again.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function restore() {
    const picked = await pickBackupFile();
    if (!picked.ok) {
      if (picked.reason === 'invalid') {
        return { ok: false, message: 'Could not read that file. Choose a ziplog backup JSON file.' };
      }
      if (picked.reason === 'unsupported') {
        return { ok: false, message: 'Restore is only available in the web app.' };
      }
      return { ok: false, cancelled: true };
    }

    const confirmed = await confirmAction({
      title: 'Restore backup?',
      message: 'This replaces all locations, trip settings, and time log data on this device.',
      confirmLabel: 'Restore',
      destructive: true,
    });
    if (!confirmed) return { ok: false, cancelled: true };

    setBusy(true);
    try {
      await importAllData(picked.data);
      await reloadAppData();
      await reloadTimeLog();
      if (picked.data.lastBackupAt !== undefined) {
        setLastBackupAt(picked.data.lastBackupAt);
      }
      return { ok: true, message: 'Backup restored successfully.' };
    } catch (error) {
      console.error('Restore failed:', error);
      return { ok: false, message: error.message || 'Could not restore that backup.' };
    } finally {
      setBusy(false);
    }
  }

  return { lastBackupAt, busy, backupNow, restore };
}
