import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import { AppShell } from './Layout';
import LocationList from './LocationList';
import { SettingsGearButton } from './SettingsMenu';
import {
  LocationAlarmModal,
  LocationFormModal,
} from './Modals';

const GET_READY_PRESETS = [
  { label: '30 min', minutes: 30 },
  { label: '1 hr', minutes: 60 },
];

function GetReadyQuickPicker({ readyTimeOffsetMinutes, onSelect }) {
  const current = readyTimeOffsetMinutes ?? 30;

  return (
    <View className="border-t border-app-border bg-app-surface px-4 py-3">
      <Text className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-app-dim">
        Get ready
      </Text>
      <View className="flex-row gap-2">
        {GET_READY_PRESETS.map((preset) => {
          const selected = current === preset.minutes;
          return (
            <Pressable
              key={preset.minutes}
              className={`flex-1 items-center rounded-xl border py-3 ${
                selected
                  ? 'border-app-accent bg-app-accent/15'
                  : 'border-app-border bg-app-card active:bg-app-surface'
              }`}
              onPress={() => onSelect(preset.minutes)}
            >
              <Text
                className={`text-base font-semibold ${selected ? 'text-app-accent' : 'text-app-text'}`}
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
  onOpenSettings,
}) {
  const [editingLocation, setEditingLocation] = useState(undefined);
  const [alarmLocation, setAlarmLocation] = useState(null);

  return (
    <AppShell className="flex-1">
      <View className="flex-1">
        <View className="border-b border-app-border bg-app-surface px-4 pb-4 pt-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold tracking-tight text-app-text">Trip Planner</Text>
            {onOpenSettings ? <SettingsGearButton onPress={onOpenSettings} /> : null}
          </View>
          <Pressable
            className="mt-4 items-center rounded-xl bg-app-accent py-3.5 active:bg-app-accent-pressed"
            onPress={() => setEditingLocation(null)}
          >
            <Text className="text-base font-semibold text-white">Add Location</Text>
          </Pressable>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.accent} />
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
    </AppShell>
  );
}
