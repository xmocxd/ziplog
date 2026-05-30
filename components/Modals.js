import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  DURATION_HINT,
  START_TIME_HINT,
  calculateAlarmTime,
  durationToDisplay,
  formatAlarmEquation,
  formatRushHourCurveBreakdown,
  formatTime24,
  parseDurationInput,
  parseClockTimeInput,
  parseStartTimeInput,
} from '../utils/time';
import {
  Field,
  FieldInput,
  ModalButton,
  ModalPanel,
  ModalShell,
} from './Layout';

export function LocationFormModal({ visible, initialLocation, onSave, onClose }) {
  const isEditing = initialLocation != null;
  const [name, setName] = useState('');
  const [allowance, setAllowance] = useState('');

  useEffect(() => {
    if (!visible) return;
    setName(initialLocation?.name ?? '');
    const minutes = initialLocation?.rushHourAllowanceMinutes;
    setAllowance(minutes != null ? durationToDisplay(minutes) : '');
  }, [visible, initialLocation]);

  const trimmedName = name.trim();

  function handleSave() {
    if (!trimmedName) return;
    const rushHourAllowanceMinutes = parseDurationInput(allowance) ?? 60;
    onSave({ id: initialLocation?.id, name: trimmedName, rushHourAllowanceMinutes });
    onClose();
  }

  return (
    <ModalShell visible={visible} onClose={onClose}>
      <ModalPanel
        title={isEditing ? 'Edit Location' : 'Add Location'}
        actions={
          <>
            <ModalButton label="Cancel" onPress={onClose} />
            <ModalButton
              label="Save"
              variant="primary"
              onPress={handleSave}
              disabled={!trimmedName}
            />
          </>
        }
      >
        <Field label="Name">
          <FieldInput value={name} onChangeText={setName} placeholder="Location name" />
        </Field>
        <Field label="Rush hour allowance" hint={DURATION_HINT}>
          <FieldInput value={allowance} onChangeText={setAllowance} placeholder="Enter rush hour allowance" />
        </Field>
      </ModalPanel>
    </ModalShell>
  );
}

export function LocationAlarmModal({
  visible,
  location,
  readyTimeOffsetMinutes,
  rushHourPeakStart,
  rushHourPeakEnd,
  onClose,
}) {
  const [step, setStep] = useState('form');
  const [startTimeValue, setStartTimeValue] = useState('');
  const [driveTimeValue, setDriveTimeValue] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setStep('form');
    setStartTimeValue('');
    setDriveTimeValue('');
    setResult(null);
    setError('');
  }, [visible, location?.id]);

  function handleOk() {
    const startTime = parseStartTimeInput(startTimeValue);
    const driveTimeMinutes = parseDurationInput(driveTimeValue);

    if (!startTime) {
      setError('Enter a valid start time (see format examples above).');
      return;
    }
    if (driveTimeMinutes == null) {
      setError('Enter a valid drive duration (see format examples above).');
      return;
    }

    setResult(
      calculateAlarmTime({
        startTime,
        driveTimeMinutes,
        maxRushHourAllowanceMinutes: location.rushHourAllowanceMinutes,
        peakStartTime: rushHourPeakStart,
        peakEndTime: rushHourPeakEnd,
        readyTimeMinutes: readyTimeOffsetMinutes,
      }),
    );
    setStep('result');
    setError('');
  }

  if (!location) return null;

  return (
    <ModalShell visible={visible} onClose={onClose}>
      {step === 'form' ? (
        <ModalPanel
          title={location.name}
          actions={
            <>
              <ModalButton label="Cancel" onPress={onClose} />
              <ModalButton label="OK" variant="primary" onPress={handleOk} />
            </>
          }
        >
          <Field label="Start Time" hint={START_TIME_HINT}>
            <FieldInput
              value={startTimeValue}
              onChangeText={setStartTimeValue}
              placeholder="Enter start time"
            />
          </Field>
          <Field label="Drive Time" hint={DURATION_HINT}>
            <FieldInput
              value={driveTimeValue}
              onChangeText={setDriveTimeValue}
              placeholder="Enter drive time"
            />
          </Field>
          {error ? <Text className="mt-3 text-sm text-red-600">{error}</Text> : null}
        </ModalPanel>
      ) : (
        <View className="rounded-t-3xl bg-white px-6 pb-8 pt-6">
          <Text className="text-xl font-bold text-gray-900">{location.name}</Text>
          <Text className="mt-6 text-lg font-bold text-gray-900">
            SET ALARM FOR: {formatTime24(result.alarmTime)}
          </Text>
          <Text className="mt-3 text-sm leading-6 text-gray-500">
            {formatAlarmEquation(result.breakdown, result.alarmTime)}
          </Text>
          <Text className="mt-2 text-xs leading-5 text-gray-400">
            {formatRushHourCurveBreakdown(result.breakdown.rushHour)}
          </Text>
          <View className="mt-6 flex-row">
            <ModalButton label="Done" variant="primary" onPress={onClose} />
          </View>
        </View>
      )}
    </ModalShell>
  );
}

export function ReadyTimeModal({ visible, readyTimeOffsetMinutes, onSave, onClose }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!visible) return;
    setValue(readyTimeOffsetMinutes != null ? durationToDisplay(readyTimeOffsetMinutes) : '');
  }, [visible, readyTimeOffsetMinutes]);

  async function handleSave() {
    const minutes = parseDurationInput(value);
    if (minutes == null) return;
    await onSave(minutes);
    onClose();
  }

  return (
    <ModalShell visible={visible} onClose={onClose}>
      <ModalPanel
        title="Edit Get-Ready Time"
        actions={
          <>
            <ModalButton label="Cancel" onPress={onClose} />
            <ModalButton label="Save" variant="primary" onPress={handleSave} />
          </>
        }
      >
        <Field label="Get-ready time" hint={DURATION_HINT}>
          <FieldInput value={value} onChangeText={setValue} placeholder="Enter get-ready time" />
        </Field>
      </ModalPanel>
    </ModalShell>
  );
}

export function RushHourPeakModal({ visible, rushHourPeakStart, rushHourPeakEnd, onSave, onClose }) {
  const [startValue, setStartValue] = useState('');
  const [endValue, setEndValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setStartValue(rushHourPeakStart || '');
    setEndValue(rushHourPeakEnd || '');
    setError('');
  }, [visible, rushHourPeakStart, rushHourPeakEnd]);

  async function handleSave() {
    const start = parseClockTimeInput(startValue);
    const end = parseClockTimeInput(endValue);

    if (!start || !end) {
      setError('Enter valid start and end times (see format examples above).');
      return;
    }

    await onSave(start, end);
    onClose();
  }

  return (
    <ModalShell visible={visible} onClose={onClose}>
      <ModalPanel
        title="Edit Rush Hour Peak Times"
        actions={
          <>
            <ModalButton label="Cancel" onPress={onClose} />
            <ModalButton label="Save" variant="primary" onPress={handleSave} />
          </>
        }
      >
        <Field label="Peak start" hint={START_TIME_HINT}>
          <FieldInput value={startValue} onChangeText={setStartValue} placeholder="Enter peak start time" />
        </Field>
        <Field label="Peak end" hint={START_TIME_HINT}>
          <FieldInput value={endValue} onChangeText={setEndValue} placeholder="Enter peak end time" />
        </Field>
        {error ? <Text className="mt-3 text-sm text-red-600">{error}</Text> : null}
      </ModalPanel>
    </ModalShell>
  );
}

export function AppMenu({ items }) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        className="rounded-lg border border-gray-300 px-3 py-2 active:bg-gray-100"
        onPress={() => setVisible(true)}
      >
        <Text className="text-sm font-semibold text-gray-700">Menu</Text>
      </Pressable>

      <ModalShell visible={visible} onClose={() => setVisible(false)} animationType="fade" align="top">
        <View className="overflow-hidden rounded-xl bg-white shadow-lg">
          <Text className="border-b border-gray-200 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Menu
          </Text>
          {items.map((item, index) => (
            <Pressable
              key={item.id}
              className={`px-4 py-4 active:bg-gray-50 ${index < items.length - 1 ? 'border-b border-gray-100' : ''}`}
              onPress={() => {
                setVisible(false);
                item.onPress();
              }}
            >
              <Text className="text-base text-gray-900">{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </ModalShell>
    </>
  );
}
