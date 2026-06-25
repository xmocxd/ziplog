import { Alert, Platform } from 'react-native';

/** Simple OK message. On web this uses window.alert. */
export function showAlert(title, message, { onDismiss } = {}) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    onDismiss?.();
    return;
  }

  Alert.alert(title, message, [{ text: 'OK', onPress: onDismiss }]);
}

/** Yes / no question. Returns true if the user confirmed. */
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
