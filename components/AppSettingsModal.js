import { useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';

import { getPersistentStorageStatus } from '../storage/requestPersistentStorage';
import { isWebIOS } from '../utils/platform';
import { ModalShell } from './Layout';

const MENU_MAX_HEIGHT = Math.round(Dimensions.get('window').height * 0.65);

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

function SectionHeader({ title }) {
  return (
    <Text className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {title}
    </Text>
  );
}

function MenuRow({ label, value, onPress, showChevron, disabled }) {
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

function InfoRow({ label, value }) {
  return (
    <View className="border-b border-gray-100 px-4 py-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-base text-gray-900">{label}</Text>
        <Text className="text-sm font-medium text-gray-500">{value}</Text>
      </View>
    </View>
  );
}

function StatusBanner({ type, message }) {
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

function SettingsHeader({ title, onBack, onClose }) {
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
  const iosWeb = isWebIOS();

  useEffect(() => {
    if (!visible) {
      setScreen('main');
      setRestoreStatus(null);
      if (restoreTimerRef.current) {
        clearTimeout(restoreTimerRef.current);
        restoreTimerRef.current = null;
      }
      return;
    }
    getPersistentStorageStatus().then(setPersistentStatus);
  }, [visible]);

  useEffect(() => {
    return () => {
      if (restoreTimerRef.current) {
        clearTimeout(restoreTimerRef.current);
      }
    };
  }, []);

  function handleClose() {
    setScreen('main');
    setRestoreStatus(null);
    if (restoreTimerRef.current) {
      clearTimeout(restoreTimerRef.current);
      restoreTimerRef.current = null;
    }
    onClose();
  }

  async function handleRestorePress() {
    setRestoreStatus(null);
    if (restoreTimerRef.current) {
      clearTimeout(restoreTimerRef.current);
      restoreTimerRef.current = null;
    }

    const result = await onRestore();
    if (!result || result.cancelled) return;

    if (result.ok) {
      setRestoreStatus({ type: 'success', message: result.message });
      restoreTimerRef.current = setTimeout(() => {
        setRestoreStatus(null);
        setScreen('main');
        restoreTimerRef.current = null;
      }, 3000);
      return;
    }

    setRestoreStatus({ type: 'error', message: result.message });
  }

  return (
    <ModalShell visible={visible} onClose={handleClose} animationType="fade" align="top">
      <View className="overflow-hidden rounded-xl bg-white shadow-lg" style={{ maxHeight: MENU_MAX_HEIGHT }}>
        <SettingsHeader
          title={screen === 'main' ? 'App Settings' : 'Backup'}
          onBack={
            screen === 'backup'
              ? () => {
                  setRestoreStatus(null);
                  if (restoreTimerRef.current) {
                    clearTimeout(restoreTimerRef.current);
                    restoreTimerRef.current = null;
                  }
                  setScreen('main');
                }
              : undefined
          }
          onClose={handleClose}
        />

        <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
          {screen === 'main' ? (
            <>
              <SectionHeader title="Trip Planner" />
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

              <SectionHeader title="Data" />
              <MenuRow
                label="Backup & restore"
                onPress={() => setScreen('backup')}
                showChevron
              />
            </>
          ) : (
            <>
              {restoreStatus ? (
                <StatusBanner type={restoreStatus.type} message={restoreStatus.message} />
              ) : null}

              {iosWeb ? (
                <Text className="border-b border-gray-100 px-4 py-3 text-xs leading-5 text-gray-500">
                  Tap Back up now and choose Save to Files to keep a copy outside Safari. Use Restore
                  if you reinstall or clear website data.
                </Text>
              ) : (
                <Text className="border-b border-gray-100 px-4 py-3 text-xs leading-5 text-gray-500">
                  Export a JSON backup to save your data outside the browser. Restore replaces all
                  locations, trip settings, and time log entries on this device.
                </Text>
              )}

              <InfoRow label="Last backup" value={formatLastBackup(lastBackupAt)} />
              <MenuRow
                label="Back up now"
                onPress={onBackupNow}
                disabled={backupBusy}
              />
              <MenuRow
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
