import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { formatDuration } from '../utils/time';
import { AppShell } from './Layout';
import LocationList from './LocationList';
import {
  AppMenu,
  BufferTimeModal,
  LocationAlarmModal,
  LocationFormModal,
  ReadyTimeModal,
  RushHourPeakModal,
} from './Modals';

const GET_READY_PRESETS = [
  { label: '30 min', minutes: 30 },
  { label: '1 hr', minutes: 60 },
];

function GetReadyQuickPicker({ readyTimeOffsetMinutes, onSelect }) {
  const current = readyTimeOffsetMinutes ?? 30;

  return (
    <View className="border-t border-gray-200 bg-white px-4 py-3">
      <Text className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
        Get ready
      </Text>
      <View className="flex-row gap-2">
        {GET_READY_PRESETS.map((preset) => {
          const selected = current === preset.minutes;
          return (
            <Pressable
              key={preset.minutes}
              className={`flex-1 items-center rounded-xl border py-3 ${
                selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white active:bg-gray-50'
              }`}
              onPress={() => onSelect(preset.minutes)}
            >
              <Text
                className={`text-base font-semibold ${selected ? 'text-blue-700' : 'text-gray-800'}`}
              >
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TripPlannerScreen({
  locations,
  loading,
  readyTimeOffsetMinutes,
  bufferTimeMinutes,
  rushHourPeakStart,
  rushHourPeakEnd,
  onSaveLocation,
  onUpdateReadyTime,
  onUpdateBufferTime,
  onUpdateRushHourPeakTimes,
}) {
  const [editingLocation, setEditingLocation] = useState(undefined);
  const [alarmLocation, setAlarmLocation] = useState(null);
  const [readyTimeOpen, setReadyTimeOpen] = useState(false);
  const [bufferTimeOpen, setBufferTimeOpen] = useState(false);
  const [rushHourPeakOpen, setRushHourPeakOpen] = useState(false);

  const menuItems = [
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
    <AppShell className="flex-1">
      <View className="flex-1">
        <View className="border-b border-gray-200 bg-white px-4 pb-4 pt-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">Trip Planner</Text>
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

        <GetReadyQuickPicker
          readyTimeOffsetMinutes={readyTimeOffsetMinutes}
          onSelect={onUpdateReadyTime}
        />
      </View>

      <LocationFormModal
        visible={editingLocation !== undefined}
        initialLocation={editingLocation}
        onSave={onSaveLocation}
        onClose={() => setEditingLocation(undefined)}
      />

      <LocationAlarmModal
        visible={alarmLocation != null}
        location={alarmLocation}
        readyTimeOffsetMinutes={readyTimeOffsetMinutes}
        bufferTimeMinutes={bufferTimeMinutes}
        rushHourPeakStart={rushHourPeakStart}
        rushHourPeakEnd={rushHourPeakEnd}
        onClose={() => setAlarmLocation(null)}
      />

      <ReadyTimeModal
        visible={readyTimeOpen}
        readyTimeOffsetMinutes={readyTimeOffsetMinutes}
        onSave={onUpdateReadyTime}
        onClose={() => setReadyTimeOpen(false)}
      />

      <BufferTimeModal
        visible={bufferTimeOpen}
        bufferTimeMinutes={bufferTimeMinutes}
        onSave={onUpdateBufferTime}
        onClose={() => setBufferTimeOpen(false)}
      />

      <RushHourPeakModal
        visible={rushHourPeakOpen}
        rushHourPeakStart={rushHourPeakStart}
        rushHourPeakEnd={rushHourPeakEnd}
        onSave={onUpdateRushHourPeakTimes}
        onClose={() => setRushHourPeakOpen(false)}
      />
    </AppShell>
  );
}
