import './global.css';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
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
import { useBackup } from './hooks/useBackup';
import { useTimeLog } from './hooks/useTimeLog';
import { prepareStorage } from './storage/forceFirstRun';
import { requestPersistentStorage } from './storage/requestPersistentStorage';
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
  const [tripSettingModal, setTripSettingModal] = useState(null);

  const timeLog = useTimeLog();
  const appData = useAppData();
  const backup = useBackup({
    reloadAppData: appData.reload,
    reloadTimeLog: timeLog.reload,
  });

  const tripPlannerMenuItems = [
    {
      id: 'ready-time',
      label: 'Get-Ready Time',
      value: formatDuration(appData.readyTimeOffsetMinutes ?? 30),
      onPress: () => setTripSettingModal('ready'),
    },
    {
      id: 'buffer-time',
      label: 'Buffer Time',
      value: formatDuration(appData.bufferTimeMinutes ?? 10),
      onPress: () => setTripSettingModal('buffer'),
    },
    {
      id: 'rush-hour',
      label: 'Rush Hour Peak',
      value: `${appData.rushHourPeakStart}–${appData.rushHourPeakEnd}`,
      onPress: () => setTripSettingModal('rush'),
    },
  ];

  async function handleSaveLocation(data) {
    if (data.id) await appData.updateLocation(data);
    else await appData.addLocation(data);
  }

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
            locations={appData.locations}
            loading={appData.loading}
            readyTimeOffsetMinutes={appData.readyTimeOffsetMinutes}
            bufferTimeMinutes={appData.bufferTimeMinutes}
            rushHourPeakStart={appData.rushHourPeakStart}
            rushHourPeakEnd={appData.rushHourPeakEnd}
            onSaveLocation={handleSaveLocation}
            onUpdateReadyTime={appData.updateReadyTimeOffset}
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
        lastBackupAt={backup.lastBackupAt}
        onBackupNow={backup.backupNow}
        onRestore={backup.restore}
        tripPlannerItems={tripPlannerMenuItems}
        backupBusy={backup.busy}
      />

      <ReadyTimeModal
        visible={tripSettingModal === 'ready'}
        readyTimeOffsetMinutes={appData.readyTimeOffsetMinutes}
        onSave={appData.updateReadyTimeOffset}
        onClose={() => setTripSettingModal(null)}
      />

      <BufferTimeModal
        visible={tripSettingModal === 'buffer'}
        bufferTimeMinutes={appData.bufferTimeMinutes}
        onSave={appData.updateBufferTime}
        onClose={() => setTripSettingModal(null)}
      />

      <RushHourPeakModal
        visible={tripSettingModal === 'rush'}
        rushHourPeakStart={appData.rushHourPeakStart}
        rushHourPeakEnd={appData.rushHourPeakEnd}
        onSave={appData.updateRushHourPeakTimes}
        onClose={() => setTripSettingModal(null)}
      />
    </SafeAreaView>
  );
}
