import { Modal, Pressable, Text, TextInput, View } from 'react-native';

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
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
        <View className="w-full items-center px-4">
          <View className="w-full" style={{ maxWidth: APP_MAX_WIDTH }}>
            {children}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function ModalPanel({ title, children, actions }) {
  return (
    <View className="rounded-t-3xl bg-white px-6 pb-8 pt-6">
      <Text className="text-xl font-bold text-gray-900">{title}</Text>
      {children}
      <View className="mt-6 flex-row gap-3">{actions}</View>
    </View>
  );
}

export function ModalButton({ label, onPress, variant = 'secondary', disabled = false }) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      className={`flex-1 items-center rounded-xl py-3 ${
        isPrimary
          ? disabled
            ? 'bg-blue-300'
            : 'bg-blue-500 active:bg-blue-600'
          : 'border border-gray-300 active:bg-gray-50'
      }`}
      onPress={onPress}
      disabled={disabled}
    >
      <Text className={`text-base font-semibold ${isPrimary ? 'text-white' : 'text-gray-700'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({ label, hint, children }) {
  return (
    <>
      <Text className="mt-6 text-sm font-medium text-gray-700">{label}</Text>
      {hint ? <Text className="mt-1 text-xs leading-4 text-gray-500">{hint}</Text> : null}
      {children}
    </>
  );
}

export function FieldInput(props) {
  return (
    <TextInput
      className="mt-2 rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900"
      autoCapitalize="none"
      {...props}
    />
  );
}
