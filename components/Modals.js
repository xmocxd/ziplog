import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  buildStartDateFromHrMin,
  calculateAlarmTime,
  formatClockTimeValue,
  formatDuration,
  formatRushHourCurveBreakdown,
  formatTime24,
  getTrafficColorClass,
  hrMinToMinutes,
  minutesToHrMin,
  parseClockTimeValue,
} from '../utils/time';
import {
  ClockTimeField,
  DurationField,
  Field,
  FieldInput,
  ModalButton,
  ModalPanel,
  ModalShell,
} from './Layout';

export function LocationFormModal({ visible, initialLocation, onSave, onClose }) {
  const isEditing = initialLocation != null;
  const [name, setName] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  useEffect(() => {
    if (!visible) return;
    setName(initialLocation?.name ?? '');
    const { hours: h, minutes: m } = minutesToHrMin(initialLocation?.rushHourAllowanceMinutes ?? 60);
    setHours(String(h));
    setMinutes(String(m));
  }, [visible, initialLocation]);

  const trimmedName = name.trim();

  function handleSave() {
    if (!trimmedName) return;
    const rushHourAllowanceMinutes = hrMinToMinutes(hours, minutes);
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
        <Field label="Rush hour allowance">
          <DurationField
            hours={hours}
            minutes={minutes}
            onChangeHours={setHours}
            onChangeMinutes={setMinutes}
          />
        </Field>
      </ModalPanel>
    </ModalShell>
  );
}

function AlarmEquationDisplay({ breakdown, alarmTime }) {
  const rushMinutes = breakdown.rushHourAllowanceMinutes;
  const rushColor = getTrafficColorClass(rushMinutes);

  return (
    <Text className="mt-3 text-sm leading-6 text-gray-500">
      {formatTime24(breakdown.startTime)} Start −{' '}
      <Text className={`font-semibold ${rushColor}`}>
        {formatDuration(rushMinutes)} Rush Hour
      </Text>
      {' '}− {formatDuration(breakdown.driveTimeMinutes)} Drive −{' '}
      {formatDuration(breakdown.bufferTimeMinutes)} Buffer −{' '}
      {formatDuration(breakdown.readyTimeMinutes)} to Get Ready ={' '}
      {formatTime24(alarmTime)} Alarm
    </Text>
  );
}

export function LocationAlarmModal({
  visible,
  location,
  readyTimeOffsetMinutes,
  bufferTimeMinutes,
  rushHourPeakStart,
  rushHourPeakEnd,
  onClose,
}) {
  const [step, setStep] = useState('form');
  const [startHours, setStartHours] = useState('');
  const [startMinutes, setStartMinutes] = useState('');
  const [driveHours, setDriveHours] = useState('');
  const [driveMinutes, setDriveMinutes] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setStep('form');
    setStartHours('');
    setStartMinutes('');
    setDriveHours('');
    setDriveMinutes('');
    setResult(null);
    setError('');
  }, [visible, location?.id]);

  function handleOk() {
    const startTime = buildStartDateFromHrMin(startHours, startMinutes);
    const driveTimeMinutes = hrMinToMinutes(driveHours, driveMinutes);

    if (!startTime) {
      setError('Enter a valid start time (HR 0–23, MIN 0–59).');
      return;
    }
    if (driveTimeMinutes <= 0) {
      setError('Enter a drive time greater than 0.');
      return;
    }

    setResult(
      calculateAlarmTime({
        startTime,
        driveTimeMinutes,
        maxRushHourAllowanceMinutes: location.rushHourAllowanceMinutes,
        peakStartTime: rushHourPeakStart,
        peakEndTime: rushHourPeakEnd,
        readyTimeMinutes: readyTimeOffsetMinutes ?? 30,
        bufferTimeMinutes: bufferTimeMinutes ?? 10,
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
          <Field label="Start Time">
            <ClockTimeField
              hours={startHours}
              minutes={startMinutes}
              onChangeHours={setStartHours}
              onChangeMinutes={setStartMinutes}
            />
          </Field>
          <Field label="Drive Time">
            <DurationField
              hours={driveHours}
              minutes={driveMinutes}
              onChangeHours={setDriveHours}
              onChangeMinutes={setDriveMinutes}
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
          <AlarmEquationDisplay breakdown={result.breakdown} alarmTime={result.alarmTime} />
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
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  useEffect(() => {
    if (!visible) return;
    const { hours: h, minutes: m } = minutesToHrMin(readyTimeOffsetMinutes ?? 30);
    setHours(String(h));
    setMinutes(String(m));
  }, [visible, readyTimeOffsetMinutes]);

  async function handleSave() {
    const total = hrMinToMinutes(hours, minutes);
    if (total <= 0) return;
    await onSave(total);
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
        <Field label="Get-ready time">
          <DurationField
            hours={hours}
            minutes={minutes}
            onChangeHours={setHours}
            onChangeMinutes={setMinutes}
          />
        </Field>
      </ModalPanel>
    </ModalShell>
  );
}

export function BufferTimeModal({ visible, bufferTimeMinutes, onSave, onClose }) {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  useEffect(() => {
    if (!visible) return;
    const { hours: h, minutes: m } = minutesToHrMin(bufferTimeMinutes ?? 10);
    setHours(String(h));
    setMinutes(String(m));
  }, [visible, bufferTimeMinutes]);

  async function handleSave() {
    const total = hrMinToMinutes(hours, minutes);
    if (total < 0) return;
    await onSave(total);
    onClose();
  }

  return (
    <ModalShell visible={visible} onClose={onClose}>
      <ModalPanel
        title="Edit Buffer Time"
        actions={
          <>
            <ModalButton label="Cancel" onPress={onClose} />
            <ModalButton label="Save" variant="primary" onPress={handleSave} />
          </>
        }
      >
        <Field label="Buffer time">
          <DurationField
            hours={hours}
            minutes={minutes}
            onChangeHours={setHours}
            onChangeMinutes={setMinutes}
          />
        </Field>
      </ModalPanel>
    </ModalShell>
  );
}

export function RushHourPeakModal({ visible, rushHourPeakStart, rushHourPeakEnd, onSave, onClose }) {
  const [startHours, setStartHours] = useState('');
  const [startMinutes, setStartMinutes] = useState('');
  const [endHours, setEndHours] = useState('');
  const [endMinutes, setEndMinutes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    const start = parseClockTimeValue(rushHourPeakStart);
    const end = parseClockTimeValue(rushHourPeakEnd);
    setStartHours(start ? String(start.hours) : '');
    setStartMinutes(start ? String(start.minutes) : '');
    setEndHours(end ? String(end.hours) : '');
    setEndMinutes(end ? String(end.minutes) : '');
    setError('');
  }, [visible, rushHourPeakStart, rushHourPeakEnd]);

  async function handleSave() {
    const startH = Number(startHours);
    const startM = Number(startMinutes);
    const endH = Number(endHours);
    const endM = Number(endMinutes);

    if (
      Number.isNaN(startH) ||
      Number.isNaN(startM) ||
      Number.isNaN(endH) ||
      Number.isNaN(endM) ||
      startH > 23 ||
      startM > 59 ||
      endH > 23 ||
      endM > 59
    ) {
      setError('Enter valid peak times (HR 0–23, MIN 0–59).');
      return;
    }

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    if (endTotal <= startTotal) {
      setError('Peak end must be after peak start.');
      return;
    }

    await onSave(formatClockTimeValue(startH, startM), formatClockTimeValue(endH, endM));
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
        <Field label="Peak start">
          <ClockTimeField
            hours={startHours}
            minutes={startMinutes}
            onChangeHours={setStartHours}
            onChangeMinutes={setStartMinutes}
          />
        </Field>
        <Field label="Peak end">
          <ClockTimeField
            hours={endHours}
            minutes={endMinutes}
            onChangeHours={setEndHours}
            onChangeMinutes={setEndMinutes}
          />
        </Field>
        {error ? <Text className="mt-3 text-sm text-red-600">{error}</Text> : null}
      </ModalPanel>
    </ModalShell>
  );
}
