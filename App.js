import './global.css';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppShell } from './components/Layout';
import LocationList from './components/LocationList';
import {
  AppMenu,
  LocationAlarmModal,
  LocationFormModal,
  ReadyTimeModal,
  RushHourPeakModal,
} from './components/Modals';
import { useAppData } from './hooks/useAppData';

export default function App() {
  const {
    locations,
    loading,
    readyTimeOffsetMinutes,
    rushHourPeakStart,
    rushHourPeakEnd,
    addLocation,
    updateLocation,
    updateReadyTimeOffset,
    updateRushHourPeakTimes,
  } = useAppData();

  const [editingLocation, setEditingLocation] = useState(undefined);
  const [alarmLocation, setAlarmLocation] = useState(null);
  const [readyTimeOpen, setReadyTimeOpen] = useState(false);
  const [rushHourPeakOpen, setRushHourPeakOpen] = useState(false);

  async function handleSaveLocation(data) {
    if (data.id) await updateLocation(data);
    else await addLocation(data);
  }

  const menuItems = [
    {
      id: 'edit-ready-time',
      label: 'Edit Get-Ready Time',
      onPress: () => setReadyTimeOpen(true),
    },
    {
      id: 'edit-rush-hour-peak',
      label: 'Edit Rush Hour Peak Times',
      onPress: () => setRushHourPeakOpen(true),
    },
  ];

  return (
    <SafeAreaView className="flex-1 items-center bg-gray-50">
      <StatusBar style="auto" />

      <AppShell className="flex-1">
        <View className="border-b border-gray-200 bg-white px-4 pb-4 pt-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">Locations</Text>
            <AppMenu items={menuItems} />
          </View>
          <Pressable
            className="mt-4 items-center rounded-xl bg-blue-500 py-3 active:bg-blue-600"
            onPress={() => setEditingLocation(null)}
          >
            <Text className="text-base font-semibold text-white">Add Location</Text>
          </Pressable>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <LocationList
            locations={locations}
            onSelect={setAlarmLocation}
            onEdit={setEditingLocation}
          />
        )}
      </AppShell>

      <LocationFormModal
        visible={editingLocation !== undefined}
        initialLocation={editingLocation}
        onSave={handleSaveLocation}
        onClose={() => setEditingLocation(undefined)}
      />

      <LocationAlarmModal
        visible={alarmLocation != null}
        location={alarmLocation}
        readyTimeOffsetMinutes={readyTimeOffsetMinutes}
        rushHourPeakStart={rushHourPeakStart}
        rushHourPeakEnd={rushHourPeakEnd}
        onClose={() => setAlarmLocation(null)}
      />

      <ReadyTimeModal
        visible={readyTimeOpen}
        readyTimeOffsetMinutes={readyTimeOffsetMinutes}
        onSave={updateReadyTimeOffset}
        onClose={() => setReadyTimeOpen(false)}
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
