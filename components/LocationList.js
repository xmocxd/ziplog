import { Pressable, ScrollView, Text, View } from 'react-native';

import { formatDuration } from '../utils/time';

export default function LocationList({ locations, onSelect, onEdit }) {
  if (locations.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-base text-app-muted">No locations yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-4 pb-6">
      <View className="gap-3 pt-1">
        {locations.map((location) => (
          <View
            key={location.id}
            className="flex-row items-stretch overflow-hidden rounded-2xl border border-app-border bg-app-card"
          >
            <Pressable
              className="flex-1 px-4 py-4 active:bg-app-surface"
              onPress={() => onSelect(location)}
            >
              <Text className="text-lg font-semibold text-app-text">{location.name}</Text>
              <Text className="mt-1 text-sm text-app-muted">
                Rush hour allowance: {formatDuration(location.rushHourAllowanceMinutes)}
              </Text>
            </Pressable>
            <Pressable
              className="items-center justify-center border-l border-app-border px-3 active:bg-app-surface"
              onPress={() => onEdit(location)}
              accessibilityLabel={`Edit ${location.name}`}
            >
              <Text className="text-lg text-app-muted">✎</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
