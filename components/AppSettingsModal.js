import { useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';

import { getPersistentStorageStatus } from '../storage/requestPersistentStorage';
import { isWebIOS } from '../utils/platform';
import { ModalShell } from './Layout';
import {
  SettingsInfoRow,
  SettingsMenuHeader,
  SettingsMenuRow,
  SettingsSectionHeader,
  SettingsStatusBanner,
} from './SettingsMenu';

const MENU_MAX_HEIGHT = Math.round(Dimensions.get('window').height * 0.65);
const RESTORE_SUCCESS_DELAY_MS = 3000;

const PERSISTENT_HINTS = {
  on: 'Your browser is less likely to clear ziplog data automatically.',
  off: 'Your browser may clear unused site data after a period of inactivity.',
  unsupported: 'This browser does not report persistent storage status.',
};

function formatLastBackup(iso) {
  if (!iso) return 'Never';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export default function AppSettingsModal({
  visible,
  onClose,
  lastBackupAt,
  onBackupNow,
  onRestore,
  tripPlannerItems,
  backupBusy,
}) {
  const [screen, setScreen] = useState('main');
  const [persistentStatus, setPersistentStatus] = useState('unsupported');
  const [restoreStatus, setRestoreStatus] = useState(null);
  const restoreTimerRef = useRef(null);

  function clearRestoreTimer() {
    if (restoreTimerRef.current) {
      clearTimeout(restoreTimerRef.current);
      restoreTimerRef.current = null;
    }
  }

  function resetRestoreUi() {
    setRestoreStatus(null);
    clearRestoreTimer();
  }

  function handleClose() {
    setScreen('main');
    resetRestoreUi();
    onClose();
  }

  function goBackToMain() {
    resetRestoreUi();
    setScreen('main');
  }

  useEffect(() => {
    if (!visible) {
      setScreen('main');
      resetRestoreUi();
      return;
    }
    getPersistentStorageStatus().then(setPersistentStatus);
  }, [visible]);

  useEffect(() => () => clearRestoreTimer(), []);

  async function handleRestorePress() {
    resetRestoreUi();
    const result = await onRestore();
    if (!result || result.cancelled) return;

    if (result.ok) {
      setRestoreStatus({ type: 'success', message: result.message });
      restoreTimerRef.current = setTimeout(() => {
        resetRestoreUi();
        setScreen('main');
      }, RESTORE_SUCCESS_DELAY_MS);
      return;
    }

    setRestoreStatus({ type: 'error', message: result.message });
  }

  const backupHint = isWebIOS()
    ? 'Tap Back up now and choose Save to Files to keep a copy outside Safari. Use Restore if you reinstall or clear website data.'
    : 'Export a JSON backup to save your data outside the browser. Restore replaces all locations, trip settings, and time log entries on this device.';

  return (
    <ModalShell visible={visible} onClose={handleClose} animationType="fade" align="top">
      <View className="overflow-hidden rounded-xl bg-white shadow-lg" style={{ maxHeight: MENU_MAX_HEIGHT }}>
        <SettingsMenuHeader
          title={screen === 'main' ? 'App Settings' : 'Backup'}
          onBack={screen === 'backup' ? goBackToMain : undefined}
          onClose={handleClose}
        />

        <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
          {screen === 'main' ? (
            <>
              <SettingsSectionHeader title="Trip Planner" />
              {tripPlannerItems.map((item) => (
                <Pressable
                  key={item.id}
                  className="border-b border-gray-100 px-4 py-4 active:bg-gray-50"
                  onPress={() => {
                    handleClose();
                    item.onPress();
                  }}
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="flex-1 text-base text-gray-900">{item.label}</Text>
                    {item.value ? (
                      <Text className="text-sm font-medium text-gray-500">{item.value}</Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}

              <SettingsSectionHeader title="Data" />
              <SettingsMenuRow
                label="Backup & restore"
                onPress={() => setScreen('backup')}
                showChevron
              />
            </>
          ) : (
            <>
              {restoreStatus ? (
                <SettingsStatusBanner type={restoreStatus.type} message={restoreStatus.message} />
              ) : null}

              <Text className="border-b border-gray-100 px-4 py-3 text-xs leading-5 text-gray-500">
                {backupHint}
              </Text>

              <SettingsInfoRow label="Last backup" value={formatLastBackup(lastBackupAt)} />
              <SettingsMenuRow label="Back up now" onPress={onBackupNow} disabled={backupBusy} />
              <SettingsMenuRow
                label="Restore from backup"
                onPress={handleRestorePress}
                disabled={backupBusy}
              />

              <Text className="px-4 py-3 text-xs leading-5 text-gray-400">
                {PERSISTENT_HINTS[persistentStatus] ?? PERSISTENT_HINTS.unsupported}
              </Text>
            </>
          )}
        </ScrollView>
      </View>
    </ModalShell>
  );
}
