import { Pressable, Text, View } from 'react-native';

export function SettingsGearButton({ onPress }) {
  return (
    <Pressable
      className="rounded-lg border border-gray-300 px-3 py-2 active:bg-gray-100"
      onPress={onPress}
      accessibilityLabel="App settings"
    >
      <Text className="text-lg text-gray-700">⚙</Text>
    </Pressable>
  );
}

export function SettingsMenuHeader({ title, onBack, onClose }) {
  return (
    <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
      <View className="min-w-[56px] flex-row items-center">
        {onBack ? (
          <Pressable onPress={onBack} className="px-1 py-1 active:opacity-60">
            <Text className="text-sm font-medium text-blue-600">‹ Back</Text>
          </Pressable>
        ) : null}
      </View>
      <Text className="text-base font-semibold text-gray-900">{title}</Text>
      <Pressable onPress={onClose} className="min-w-[56px] items-end px-2 py-1 active:opacity-60">
        <Text className="text-sm font-medium text-blue-600">Done</Text>
      </Pressable>
    </View>
  );
}

export function SettingsSectionHeader({ title }) {
  return (
    <Text className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {title}
    </Text>
  );
}

export function SettingsMenuRow({ label, value, onPress, showChevron, disabled }) {
  return (
    <Pressable
      className={`border-b border-gray-100 px-4 py-4 ${disabled ? 'opacity-50' : 'active:bg-gray-50'}`}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-base text-gray-900">{label}</Text>
        {value ? <Text className="text-sm font-medium text-gray-500">{value}</Text> : null}
        {showChevron ? <Text className="text-base text-gray-400">›</Text> : null}
      </View>
    </Pressable>
  );
}

export function SettingsInfoRow({ label, value }) {
  return (
    <View className="border-b border-gray-100 px-4 py-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-base text-gray-900">{label}</Text>
        <Text className="text-sm font-medium text-gray-500">{value}</Text>
      </View>
    </View>
  );
}

export function SettingsStatusBanner({ type, message }) {
  const isSuccess = type === 'success';
  return (
    <View
      className={`border-b px-4 py-3 ${isSuccess ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
    >
      <Text className={`text-sm font-medium ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
        {message}
      </Text>
      {isSuccess ? (
        <Text className="mt-1 text-xs text-green-700">Returning to settings…</Text>
      ) : null}
    </View>
  );
}
