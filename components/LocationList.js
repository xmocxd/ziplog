import { Pressable, ScrollView, Text, View } from 'react-native';

import { formatDuration } from '../utils/time';

export default function LocationList({ locations, onSelect, onEdit }) {
  if (locations.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-base text-gray-500">No locations yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-4 pb-6">
      <View className="gap-3 pt-1">
        {locations.map((location) => (
          <View
            key={location.id}
            className="flex-row items-stretch rounded-xl border border-gray-200 bg-white"
          >
            <Pressable
              className="flex-1 px-4 py-4 active:bg-gray-50"
              onPress={() => onSelect(location)}
            >
              <Text className="text-lg font-semibold text-gray-900">{location.name}</Text>
              <Text className="mt-1 text-sm text-gray-500">
                Rush hour allowance: {formatDuration(location.rushHourAllowanceMinutes)}
              </Text>
            </Pressable>
            <Pressable
              className="items-center justify-center border-l border-gray-200 px-3 active:bg-gray-50"
              onPress={() => onEdit(location)}
              accessibilityLabel={`Edit ${location.name}`}
            >
              <Text className="text-lg text-gray-500">✎</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
