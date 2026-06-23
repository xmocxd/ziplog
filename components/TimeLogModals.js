import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { confirmAction } from '../utils/confirm';
import {
  buildEndDateFromHrMin,
  buildPastDateFromHrMin,
  getEntryDurationMinutes,
  hrMinToMinutes,
  minutesToHrMin,
} from '../utils/time';
import { hexWithAlpha } from '../utils/taskColors';
import { ClockTimeField, DurationField, Field, ModalButton, ModalPanel, ModalShell } from './Layout';

export function ClockTimeModal({ visible, mode, taskName, startTime, onSave, onClose }) {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const hoursRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    setHours('');
    setMinutes('');
    const timer = setTimeout(() => hoursRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [visible, mode]);

  function handleSave() {
    if (mode === 'start') {
      const start = buildPastDateFromHrMin(hours, minutes);
      if (!start) return;
      onSave(start);
    } else {
      const end = buildEndDateFromHrMin(hours, minutes, startTime);
      if (!end) return;
      onSave(end);
    }
    onClose();
  }

  const title = mode === 'start' ? `Set ${taskName} start time` : `Set ${taskName} end time`;

  return (
    <ModalShell visible={visible} onClose={onClose}>
      <ModalPanel
        title={title}
        actions={
          <>
            <ModalButton label="Cancel" onPress={onClose} />
            <ModalButton label="Save" variant="primary" onPress={handleSave} />
          </>
        }
      >
        <Field label={mode === 'start' ? 'Start time' : 'End time'}>
          <ClockTimeField
            hours={hours}
            minutes={minutes}
            onChangeHours={setHours}
            onChangeMinutes={setMinutes}
            hoursRef={hoursRef}
          />
        </Field>
      </ModalPanel>
    </ModalShell>
  );
}

export function ManualBlockModal({ visible, taskTypes, onSave, onClose }) {
  const [taskTypeId, setTaskTypeId] = useState('work');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const hoursRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    setTaskTypeId(taskTypes[0]?.id ?? 'work');
    setHours('');
    setMinutes('');
    const timer = setTimeout(() => hoursRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [visible, taskTypes]);

  function handleSave() {
    const total = hrMinToMinutes(hours, minutes);
    if (total <= 0 || !taskTypeId) return;
    onSave(taskTypeId, total);
    onClose();
  }

  return (
    <ModalShell visible={visible} onClose={onClose}>
      <ModalPanel
        title="Add time block"
        actions={
          <>
            <ModalButton label="Cancel" onPress={onClose} />
            <ModalButton label="Add" variant="primary" onPress={handleSave} />
          </>
        }
      >
        <Field label="Task">
          <View className="mt-2 flex-row gap-2">
            {taskTypes.map((task) => (
              <Pressable
                key={task.id}
                className="flex-1 items-center rounded-xl border py-3 active:opacity-80"
                style={{
                  borderColor: taskTypeId === task.id ? task.color : '#d1d5db',
                  backgroundColor:
                    taskTypeId === task.id ? hexWithAlpha(task.color, 0.12) : '#ffffff',
                }}
                onPress={() => setTaskTypeId(task.id)}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: taskTypeId === task.id ? task.color : '#374151' }}
                >
                  {task.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </Field>
        <Field label="Duration">
          <DurationField
            hours={hours}
            minutes={minutes}
            onChangeHours={setHours}
            onChangeMinutes={setMinutes}
            hoursRef={hoursRef}
          />
        </Field>
      </ModalPanel>
    </ModalShell>
  );
}

const ADJUSTMENTS = [
  { label: '−1 hr', delta: -60 },
  { label: '−30 min', delta: -30 },
  { label: '−15 min', delta: -15 },
  { label: '+15 min', delta: 15 },
  { label: '+30 min', delta: 30 },
  { label: '+1 hr', delta: 60 },
];

export function EntryEditModal({
  visible,
  entry,
  onAdjust,
  onSetDuration,
  onRename,
  onDelete,
  onClose,
}) {
  const [name, setName] = useState('');
  const [editingDuration, setEditingDuration] = useState(false);
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutesInput, setDurationMinutesInput] = useState('');
  const durationHoursRef = useRef(null);
  const isRunning = entry?.endTime == null;
  const entryDurationMinutes = entry ? (getEntryDurationMinutes(entry) ?? 0) : 0;

  useEffect(() => {
    if (!visible || !entry) return;
    setName(entry.name);
    setEditingDuration(false);
    const { hours, minutes } = minutesToHrMin(getEntryDurationMinutes(entry) ?? 0);
    setDurationHours(hours ? String(hours) : '');
    setDurationMinutesInput(minutes ? String(minutes) : '');
  }, [visible, entry]);

  if (!entry) return null;

  function isSubtractDisabled(delta) {
    return delta < 0 && entryDurationMinutes + delta < 1;
  }

  function handleSave() {
    const trimmed = name.trim();
    if (trimmed && trimmed !== entry.name) onRename(trimmed);
    onClose();
  }

  function handleApplyDuration() {
    const total = hrMinToMinutes(durationHours, durationMinutesInput);
    if (total < 1) return;
    onSetDuration(total);
    setEditingDuration(false);
  }

  function handleToggleDurationEdit() {
    if (editingDuration) {
      setEditingDuration(false);
      return;
    }
    const { hours, minutes } = minutesToHrMin(entryDurationMinutes);
    setDurationHours(hours ? String(hours) : '');
    setDurationMinutesInput(minutes ? String(minutes) : '');
    setEditingDuration(true);
    setTimeout(() => durationHoursRef.current?.focus(), 100);
  }

  async function handleDelete() {
    const confirmed = await confirmAction({
      title: 'Delete entry?',
      message: `Remove "${entry.name}" from the time log?`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (confirmed) onDelete();
  }

  return (
    <ModalShell visible={visible} onClose={onClose}>
      <ModalPanel
        title="Edit entry"
        headerRight={
          <Pressable
            className="rounded-lg px-2 py-1 active:bg-red-50"
            onPress={handleDelete}
            accessibilityLabel="Delete entry"
          >
            <Text className="text-sm font-semibold text-red-600">Delete</Text>
          </Pressable>
        }
        actions={<ModalButton label="Done" variant="primary" onPress={handleSave} />}
      >
        <Field label="Name">
          <TextInput
            className="mt-2 rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900"
            value={name}
            onChangeText={setName}
            placeholder="Task name"
            autoCapitalize="words"
          />
        </Field>

        {!isRunning ? (
          <View className="mt-6">
            <Text className="text-sm font-medium text-gray-700">Adjust duration</Text>
            <View className="mt-3 flex-row flex-wrap items-center gap-2">
              {ADJUSTMENTS.map((item) => {
                const disabled = isSubtractDisabled(item.delta);
                return (
                  <Pressable
                    key={item.label}
                    className={`rounded-lg border px-3 py-2 ${
                      disabled ? 'border-gray-200 bg-gray-50' : 'border-gray-300 active:bg-gray-50'
                    }`}
                    onPress={() => !disabled && onAdjust(item.delta)}
                    disabled={disabled}
                  >
                    <Text
                      className={`text-sm font-medium ${disabled ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                className={`rounded-lg border px-3 py-2 ${
                  editingDuration
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 active:bg-gray-50'
                }`}
                onPress={handleToggleDurationEdit}
              >
                <Text
                  className={`text-sm font-medium ${editingDuration ? 'text-blue-700' : 'text-gray-700'}`}
                >
                  Edit
                </Text>
              </Pressable>
            </View>
            {editingDuration ? (
              <View className="mt-3">
                <DurationField
                  hours={durationHours}
                  minutes={durationMinutesInput}
                  onChangeHours={setDurationHours}
                  onChangeMinutes={setDurationMinutesInput}
                  hoursRef={durationHoursRef}
                  className="mt-0"
                />
                <View className="mt-3 flex-row gap-2">
                  <Pressable
                    className="rounded-lg border border-gray-300 px-4 py-2 active:bg-gray-50"
                    onPress={() => setEditingDuration(false)}
                  >
                    <Text className="text-sm font-medium text-gray-700">Cancel</Text>
                  </Pressable>
                  <Pressable
                    className="rounded-lg bg-blue-500 px-4 py-2 active:bg-blue-600"
                    onPress={handleApplyDuration}
                  >
                    <Text className="text-sm font-semibold text-white">Set duration</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          <Text className="mt-4 text-sm text-gray-500">Stop the task to adjust duration.</Text>
        )}
      </ModalPanel>
    </ModalShell>
  );
}
