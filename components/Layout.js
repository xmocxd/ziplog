import { Modal, Pressable, Text, TextInput, View } from 'react-native';

import { theme } from '../constants/theme';

const APP_MAX_WIDTH = 900;

export function AppShell({ children, className = '' }) {
  return (
    <View className={`w-full self-center ${className}`} style={{ maxWidth: APP_MAX_WIDTH }}>
      {children}
    </View>
  );
}

export function ModalShell({
  visible,
  onClose,
  children,
  animationType = 'slide',
  align = 'bottom',
}) {
  const alignmentClass = align === 'top' ? 'justify-start pt-16' : 'justify-end';

  return (
    <Modal visible={visible} animationType={animationType} transparent onRequestClose={onClose}>
      <View className={`flex-1 ${alignmentClass}`}>
        <Pressable className="absolute inset-0 bg-black/70" onPress={onClose} />
        <View className="w-full items-center px-4">
          <View className="w-full" style={{ maxWidth: APP_MAX_WIDTH }}>
            {children}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function ModalPanel({ title, headerRight, children, actions }) {
  return (
    <View className="rounded-t-3xl border-t border-app-border bg-app-card px-6 pb-8 pt-6">
      {headerRight ? (
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-app-text">{title}</Text>
          {headerRight}
        </View>
      ) : (
        <Text className="text-xl font-bold text-app-text">{title}</Text>
      )}
      {children}
      <View className="mt-6 flex-row gap-3">{actions}</View>
    </View>
  );
}

export function ModalButton({ label, onPress, variant = 'secondary', disabled = false }) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      className={`flex-1 items-center rounded-xl py-3.5 ${
        isPrimary
          ? disabled
            ? 'bg-app-accent/40'
            : 'bg-app-accent active:bg-app-accent-pressed'
          : 'border border-app-border bg-app-surface active:opacity-80'
      }`}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        className={`text-base font-semibold ${isPrimary ? 'text-white' : 'text-app-text'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({ label, hint, children }) {
  return (
    <>
      <Text className="mt-6 text-sm font-medium text-app-muted">{label}</Text>
      {hint ? <Text className="mt-1 text-xs leading-4 text-app-dim">{hint}</Text> : null}
      {children}
    </>
  );
}

export function FieldInput(props) {
  return (
    <TextInput
      className="mt-2 rounded-xl border border-app-border bg-app-surface px-4 py-3 text-base text-app-text"
      placeholderTextColor={theme.placeholder}
      autoCapitalize="none"
      {...props}
    />
  );
}

function filterIntegerInput(text, max = null) {
  const filtered = text.replace(/\D/g, '');
  if (max == null || filtered === '') return filtered;
  const value = Number.parseInt(filtered, 10);
  return value > max ? String(max) : filtered;
}

function IntegerInput({ value, onChangeText, max, placeholder, inputRef, compact = false }) {
  return (
    <TextInput
      ref={inputRef}
      className={
        compact
          ? 'w-16 rounded-xl border border-app-border bg-app-surface px-2 py-3 text-center text-base text-app-text'
          : 'flex-1 rounded-xl border border-app-border bg-app-surface px-4 py-3 text-center text-base text-app-text'
      }
      value={value}
      onChangeText={(text) => onChangeText(filterIntegerInput(text, max))}
      keyboardType="number-pad"
      maxLength={max != null ? String(max).length : undefined}
      placeholder={placeholder}
      placeholderTextColor={theme.placeholder}
    />
  );
}

export function DurationField({
  hours,
  minutes,
  onChangeHours,
  onChangeMinutes,
  hoursRef,
  className = 'mt-2',
}) {
  return (
    <View className={`${className} flex-row flex-wrap items-center gap-2`}>
      <IntegerInput
        value={hours}
        onChangeText={onChangeHours}
        placeholder="0"
        inputRef={hoursRef}
        compact
      />
      <Text className="text-base text-app-muted">hrs</Text>
      <IntegerInput
        value={minutes}
        onChangeText={onChangeMinutes}
        max={59}
        placeholder="0"
        compact
      />
      <Text className="text-base text-app-muted">mins</Text>
    </View>
  );
}

export function ClockTimeField({ hours, minutes, onChangeHours, onChangeMinutes, hoursRef, className = 'mt-2' }) {
  return (
    <View className={`${className} flex-row items-center justify-center gap-2`}>
      <IntegerInput
        value={hours}
        onChangeText={onChangeHours}
        max={23}
        placeholder="00"
        inputRef={hoursRef}
        compact
      />
      <Text className="text-xl font-medium text-app-dim">:</Text>
      <IntegerInput
        value={minutes}
        onChangeText={onChangeMinutes}
        max={59}
        placeholder="00"
        compact
      />
    </View>
  );
}
