import './global.css';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomNav from './components/BottomNav';
import TimeLogScreen from './components/TimeLogScreen';
import TripPlannerScreen from './components/TripPlannerScreen';
import { useAppData } from './hooks/useAppData';
import { useTimeLog } from './hooks/useTimeLog';
import { prepareStorage } from './storage/forceFirstRun';

export default function App() {
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    prepareStorage()
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
  } = useAppData();

  async function handleSaveLocation(data) {
    if (data.id) await updateLocation(data);
    else await addLocation(data);
  }

  return (
    <SafeAreaView className="flex-1 items-center bg-gray-50" edges={['top', 'left', 'right']}>
      <StatusBar style="auto" />

      <View className="w-full flex-1" style={{ maxWidth: 900 }}>
        <View className="flex-1" style={{ display: activeTab === 'timelog' ? 'flex' : 'none' }}>
          <TimeLogScreen
            addBlockOpen={addBlockOpen}
            onAddBlockClose={() => setAddBlockOpen(false)}
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
    </SafeAreaView>
  );
}
