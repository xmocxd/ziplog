import { Pressable, Text, View } from 'react-native';

export function SettingsGearButton({ onPress }) {
  return (
    <Pressable
      className="rounded-xl border border-app-border bg-app-card px-3 py-2 active:bg-app-surface"
      onPress={onPress}
      accessibilityLabel="App settings"
    >
      <Text className="text-lg text-app-muted">⚙</Text>
    </Pressable>
  );
}

export function SettingsMenuHeader({ title, onBack, onClose }) {
  return (
    <View className="flex-row items-center justify-between border-b border-app-border px-4 py-3">
      <View className="min-w-[56px] flex-row items-center">
        {onBack ? (
          <Pressable onPress={onBack} className="px-1 py-1 active:opacity-60">
            <Text className="text-sm font-medium text-app-accent">‹ Back</Text>
          </Pressable>
        ) : null}
      </View>
      <Text className="text-base font-semibold text-app-text">{title}</Text>
      <Pressable onPress={onClose} className="min-w-[56px] items-end px-2 py-1 active:opacity-60">
        <Text className="text-sm font-medium text-app-accent">Done</Text>
      </Pressable>
    </View>
  );
}

export function SettingsSectionHeader({ title }) {
  return (
    <Text className="border-b border-app-border bg-app-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide text-app-dim">
      {title}
    </Text>
  );
}

export function SettingsMenuRow({ label, value, onPress, showChevron, disabled }) {
  return (
    <Pressable
      className={`border-b border-app-border/60 px-4 py-4 ${disabled ? 'opacity-50' : 'active:bg-app-surface'}`}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-base text-app-text">{label}</Text>
        {value ? <Text className="text-sm font-medium text-app-muted">{value}</Text> : null}
        {showChevron ? <Text className="text-base text-app-dim">›</Text> : null}
      </View>
    </Pressable>
  );
}

export function SettingsInfoRow({ label, value }) {
  return (
    <View className="border-b border-app-border/60 px-4 py-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-base text-app-text">{label}</Text>
        <Text className="text-sm font-medium text-app-muted">{value}</Text>
      </View>
    </View>
  );
}

export function SettingsStatusBanner({ type, message }) {
  const isSuccess = type === 'success';
  return (
    <View
      className={`border-b px-4 py-3 ${
        isSuccess ? 'border-app-running/30 bg-app-running/10' : 'border-app-danger/30 bg-app-danger/10'
      }`}
    >
      <Text className={`text-sm font-medium ${isSuccess ? 'text-app-running' : 'text-app-danger'}`}>
        {message}
      </Text>
      {isSuccess ? (
        <Text className="mt-1 text-xs text-app-running/80">Returning to settings…</Text>
      ) : null}
    </View>
  );
}
