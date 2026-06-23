import { Alert, Platform } from 'react-native';

export function confirmAction({
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  destructive = false,
}) {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      const text = message ? `${title}\n\n${message}` : title;
      resolve(window.confirm(text));
      return;
    }

    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}
