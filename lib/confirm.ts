import { Alert, Platform } from 'react-native';

export function confirmDialog(title: string, message: string, confirmLabel = 'Excluir'): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: confirmLabel === 'Excluir' ? 'destructive' : 'default', onPress: () => resolve(true) },
    ]);
  });
}
