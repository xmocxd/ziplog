import './global.css';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppSettingsModal from './components/AppSettingsModal';
import BottomNav from './components/BottomNav';
import {
  BufferTimeModal,
  ReadyTimeModal,
  RushHourPeakModal,
} from './components/Modals';
import TimeLogScreen from './components/TimeLogScreen';
import TripPlannerScreen from './components/TripPlannerScreen';
import { useAppData } from './hooks/useAppData';
import { useTimeLog } from './hooks/useTimeLog';
import { exportAllData, importAllData, pickBackupFile, shareOrDownloadBackup } from './storage/backup';
import { prepareStorage } from './storage/forceFirstRun';
import { requestPersistentStorage } from './storage/requestPersistentStorage';
import { loadSettings, saveLastBackupAt } from './storage/settingsStore';
import { confirmAction } from './utils/confirm';
import { formatDuration } from './utils/time';

export default function App() {
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    prepareStorage()
      .then(async () => {
        if (Platform.OS === 'web') {
          const result = await requestPersistentStorage();
          if (__DEV__ && result.persisted) {
            console.log('Persistent storage granted');
          }
        }
      })
      .catch((error) => console.error('Storage prep failed:', error))
      .finally(() => setStorageReady(true));
  }, []);

  if (!storageReady) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50" edges={['top', 'left', 'right']}>
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  return <AppContent />;
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('timelog');
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [readyTimeOpen, setReadyTimeOpen] = useState(false);
  const [bufferTimeOpen, setBufferTimeOpen] = useState(false);
  const [rushHourPeakOpen, setRushHourPeakOpen] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const backupInFlight = useRef(false);

  const timeLog = useTimeLog();
  const {
    locations,
    loading,
    readyTimeOffsetMinutes,
    bufferTimeMinutes,
    rushHourPeakStart,
    rushHourPeakEnd,
    addLocation,
    updateLocation,
    updateReadyTimeOffset,
    updateBufferTime,
    updateRushHourPeakTimes,
    reload: reloadAppData,
  } = useAppData();

  useEffect(() => {
    loadSettings()
      .then((settings) => setLastBackupAt(settings.lastBackupAt))
      .catch((error) => console.error('Failed to load settings:', error));
  }, []);

  async function handleSaveLocation(data) {
    if (data.id) await updateLocation(data);
    else await addLocation(data);
  }

  async function handleBackupNow() {
    if (backupInFlight.current) return;
    backupInFlight.current = true;
    try {
      const data = await exportAllData();
      setBackupBusy(true);
      const result = await shareOrDownloadBackup(data);
      if (result.ok) {
        const at = new Date().toISOString();
        await saveLastBackupAt(at);
        setLastBackupAt(at);
      }
    } catch (error) {
      console.error('Backup failed:', error);
      Alert.alert('Backup failed', 'Could not save the backup file. Try again.');
    } finally {
      backupInFlight.current = false;
      setBackupBusy(false);
    }
  }

  async function handleRestore() {
    const picked = await pickBackupFile();
    if (!picked.ok) {
      if (picked.reason === 'invalid') {
        return {
          ok: false,
          message: 'Could not read that file. Choose a ziplog backup JSON file.',
        };
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

    setBackupBusy(true);
    try {
      await importAllData(picked.data);
      await Promise.all([reloadAppData(), timeLog.reload()]);
      return { ok: true, message: 'Backup restored successfully.' };
    } catch (error) {
      console.error('Restore failed:', error);
      return {
        ok: false,
        message: error.message || 'Could not restore that backup.',
      };
    } finally {
      setBackupBusy(false);
    }
  }

  const tripPlannerMenuItems = [
    {
      id: 'edit-ready-time',
      label: 'Get-Ready Time',
      value: formatDuration(readyTimeOffsetMinutes ?? 30),
      onPress: () => setReadyTimeOpen(true),
    },
    {
      id: 'edit-buffer-time',
      label: 'Buffer Time',
      value: formatDuration(bufferTimeMinutes ?? 10),
      onPress: () => setBufferTimeOpen(true),
    },
    {
      id: 'edit-rush-hour-peak',
      label: 'Rush Hour Peak',
      value: `${rushHourPeakStart}–${rushHourPeakEnd}`,
      onPress: () => setRushHourPeakOpen(true),
    },
  ];

  return (
    <SafeAreaView className="flex-1 items-center bg-gray-50" edges={['top', 'left', 'right']}>
      <StatusBar style="auto" />

      <View className="w-full flex-1" style={{ maxWidth: 900 }}>
        <View className="flex-1" style={{ display: activeTab === 'timelog' ? 'flex' : 'none' }}>
          <TimeLogScreen
            addBlockOpen={addBlockOpen}
            onAddBlockClose={() => setAddBlockOpen(false)}
            onOpenSettings={() => setSettingsOpen(true)}
            {...timeLog}
          />
        </View>
        <View className="flex-1" style={{ display: activeTab === 'planner' ? 'flex' : 'none' }}>
          <TripPlannerScreen
            locations={locations}
            loading={loading}
            readyTimeOffsetMinutes={readyTimeOffsetMinutes}
            bufferTimeMinutes={bufferTimeMinutes}
            rushHourPeakStart={rushHourPeakStart}
            rushHourPeakEnd={rushHourPeakEnd}
            onSaveLocation={handleSaveLocation}
            onUpdateReadyTime={updateReadyTimeOffset}
            onUpdateBufferTime={updateBufferTime}
            onUpdateRushHourPeakTimes={updateRushHourPeakTimes}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </View>

        <SafeAreaView edges={['bottom']}>
          <BottomNav
            activeTab={activeTab}
            onTabPress={setActiveTab}
            showAddBlock={activeTab === 'timelog'}
            onAddBlock={() => setAddBlockOpen(true)}
          />
        </SafeAreaView>
      </View>

      <AppSettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        lastBackupAt={lastBackupAt}
        onBackupNow={handleBackupNow}
        onRestore={handleRestore}
        tripPlannerItems={tripPlannerMenuItems}
        backupBusy={backupBusy}
      />

      <ReadyTimeModal
        visible={readyTimeOpen}
        readyTimeOffsetMinutes={readyTimeOffsetMinutes}
        onSave={updateReadyTimeOffset}
        onClose={() => setReadyTimeOpen(false)}
      />

      <BufferTimeModal
        visible={bufferTimeOpen}
        bufferTimeMinutes={bufferTimeMinutes}
        onSave={updateBufferTime}
        onClose={() => setBufferTimeOpen(false)}
      />

      <RushHourPeakModal
        visible={rushHourPeakOpen}
        rushHourPeakStart={rushHourPeakStart}
        rushHourPeakEnd={rushHourPeakEnd}
        onSave={updateRushHourPeakTimes}
        onClose={() => setRushHourPeakOpen(false)}
      />
    </SafeAreaView>
  );
}
