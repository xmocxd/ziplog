import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import {
  formatDuration,
  formatRunningMinutes,
  formatShortDate,
  formatTime24,
  getEntryDurationMinutes,
} from '../utils/time';
import { useRunningElapsedMinutes } from '../hooks/useRunningMinuteTick';
import { AppShell } from './Layout';
import { ClockTimeModal, EntryEditModal, ManualBlockModal } from './TimeLogModals';
import { TaskSplitButton } from './TimeLogParts';

const OLIVE = '#6b7c3f';
const ORANGE = '#ea580c';

function formatAdjustment(minutes) {
  const sign = minutes > 0 ? '+' : '−';
  return `${sign}${formatDuration(Math.abs(minutes))}`;
}

function formatEntryDateLine(entry) {
  const date = formatShortDate(entry.startTime);
  if (entry.isManualBlock) return `${date} (block added)`;
  const start = formatTime24(entry.startTime);
  return start ? `${date} · ${start}` : date;
}

function TimeLogRow({ entry, taskColor, onPress }) {
  const isRunning = entry.endTime == null;
  const runningMinutes = useRunningElapsedMinutes(entry.startTime, isRunning);
  const duration = getEntryDurationMinutes(entry);
  const adjustment = entry.adjustedMinutes || 0;
  const hasAdjustment = adjustment !== 0;

  let borderClass = 'border-gray-200 bg-white';
  let rowStyle;
  if (isRunning) borderClass = 'border-green-300 bg-green-50';
  else if (hasAdjustment) {
    borderClass = 'border';
    rowStyle =
      adjustment > 0
        ? { borderColor: '#a3ad7a', backgroundColor: '#f4f5ef' }
        : { borderColor: '#fdba74', backgroundColor: '#fff7ed' };
  }

  return (
    <Pressable
      className={`rounded-xl border px-4 py-3 ${borderClass}`}
      style={rowStyle}
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold" style={{ color: taskColor }}>
          {entry.name}
        </Text>
        {isRunning ? (
          <Text className="text-sm font-medium text-green-700">
            {formatRunningMinutes(runningMinutes)}
          </Text>
        ) : (
          <Text className="text-sm font-medium text-gray-700">{formatDuration(duration)}</Text>
        )}
      </View>
      <View className="mt-1 flex-row flex-wrap items-center gap-2">
        <Text className="text-sm text-gray-500">{formatEntryDateLine(entry)}</Text>
        {hasAdjustment ? (
          <Text
            className="text-sm font-medium"
            style={{ color: adjustment > 0 ? OLIVE : ORANGE }}
          >
            {formatAdjustment(adjustment)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function TimeLogScreen({
  addBlockOpen,
  onAddBlockClose,
  taskTypes,
  entries,
  visibleEntries,
  hasMoreEntries,
  loading,
  runningEntry,
  over24hRemoved,
  clearOver24hFlag,
  startTask,
  stopTask,
  addManualBlock,
  updateEntry,
  adjustEntryDuration,
  setEntryDuration,
  deleteEntry,
}) {
  const [clockModal, setClockModal] = useState(null);
  const [editingEntryId, setEditingEntryId] = useState(null);

  const editingEntry = entries.find((e) => e.id === editingEntryId) ?? null;

  const taskColorById = Object.fromEntries(taskTypes.map((t) => [t.id, t.color]));

  useEffect(() => {
    if (!over24hRemoved) return;
    Alert.alert(
      'Task removed',
      'A running task exceeded 24 hours and was removed as a possible error.',
      [{ text: 'OK', onPress: clearOver24hFlag }],
    );
  }, [over24hRemoved, clearOver24hFlag]);

  async function handleStartStop(taskType) {
    const isRunning = runningEntry?.taskTypeId === taskType.id;
    if (isRunning) {
      const result = await stopTask(taskType.id);
      if (result.reason === 'over24h') {
        Alert.alert('Task removed', 'This task exceeded 24 hours and was removed as a possible error.');
      }
      return;
    }
    if (runningEntry) {
      Alert.alert('Task already running', 'Stop the current task before starting another.');
      return;
    }
    await startTask(taskType.id);
  }

  async function handleClockSave(time) {
    if (!clockModal) return;
    const { taskType, mode } = clockModal;
    if (mode === 'start') {
      if (runningEntry) {
        Alert.alert('Task already running', 'Stop the current task before starting another.');
        return;
      }
      const result = await startTask(taskType.id, time);
      if (result.reason === 'over24h') {
        Alert.alert('Invalid time', 'Start time cannot be more than 24 hours ago.');
      }
    } else {
      const result = await stopTask(taskType.id, time);
      if (result.reason === 'over24h') {
        Alert.alert('Task removed', 'That end time exceeds 24 hours and the entry was removed.');
      } else if (result.reason === 'before-start') {
        Alert.alert('Invalid time', 'End time must be after the start time.');
      }
    }
  }

  async function handleManualBlock(taskTypeId, minutes) {
    const result = await addManualBlock(taskTypeId, minutes);
    if (result.reason === 'over24h') {
      Alert.alert('Too long', 'A single entry cannot exceed 24 hours.');
    }
  }

  async function handleAdjust(delta) {
    if (!editingEntryId) return;
    const result = await adjustEntryDuration(editingEntryId, delta);
    if (result?.reason === 'over24h') {
      Alert.alert('Too long', 'A single entry cannot exceed 24 hours.');
    }
  }

  async function handleSetDuration(totalMinutes) {
    if (!editingEntryId) return;
    const result = await setEntryDuration(editingEntryId, totalMinutes);
    if (result?.reason === 'over24h') {
      Alert.alert('Too long', 'A single entry cannot exceed 24 hours.');
    } else if (result?.reason === 'below_min') {
      Alert.alert('Too short', 'Duration must be at least 1 minute.');
    }
  }

  async function handleRename(name) {
    if (!editingEntryId) return;
    await updateEntry(editingEntryId, { name });
  }

  async function handleDelete() {
    if (!editingEntryId) return;
    await deleteEntry(editingEntryId);
    setEditingEntryId(null);
  }

  return (
    <AppShell className="flex-1">
      <View className="flex-1 px-4 pt-2">
        <Text className="text-2xl font-bold text-gray-900">Time Log</Text>

        <View className="mt-3 min-h-0 flex-1">
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          ) : visibleEntries.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-base text-gray-500">No logged tasks yet.</Text>
            </View>
          ) : (
            <ScrollView className="flex-1">
              <View className="gap-2 pb-2">
                {visibleEntries.map((entry) => (
                  <TimeLogRow
                    key={entry.id}
                    entry={entry}
                    taskColor={taskColorById[entry.taskTypeId] ?? '#2563eb'}
                    onPress={() => setEditingEntryId(entry.id)}
                  />
                ))}
                {hasMoreEntries ? (
                  <Pressable className="items-center py-3 active:opacity-70">
                    <Text className="text-sm font-semibold text-blue-600">More...</Text>
                  </Pressable>
                ) : null}
              </View>
            </ScrollView>
          )}
        </View>

        <View className="min-h-0 flex-1 justify-center gap-3 py-4">
          {taskTypes.map((taskType) => {
            const isRunning = runningEntry?.taskTypeId === taskType.id;
            const isBlocked = runningEntry != null && !isRunning;
            return (
              <TaskSplitButton
                key={taskType.id}
                taskName={taskType.name}
                taskColor={taskType.color}
                isRunning={isRunning}
                isBlocked={isBlocked}
                runningStartTime={isRunning ? runningEntry.startTime : null}
                onStartStop={() => handleStartStop(taskType)}
                onSetTime={() =>
                  setClockModal({
                    taskType,
                    mode: isRunning ? 'stop' : 'start',
                    startTime: isRunning ? runningEntry.startTime : null,
                  })
                }
              />
            );
          })}
        </View>
      </View>

      <ClockTimeModal
        visible={clockModal != null}
        mode={clockModal?.mode ?? 'start'}
        taskName={clockModal?.taskType?.name ?? ''}
        startTime={clockModal?.startTime}
        onSave={handleClockSave}
        onClose={() => setClockModal(null)}
      />

      <ManualBlockModal
        visible={addBlockOpen}
        taskTypes={taskTypes}
        onSave={handleManualBlock}
        onClose={onAddBlockClose}
      />

      <EntryEditModal
        visible={editingEntryId != null}
        entry={editingEntry}
        onAdjust={handleAdjust}
        onSetDuration={handleSetDuration}
        onRename={handleRename}
        onDelete={handleDelete}
        onClose={() => setEditingEntryId(null)}
      />
    </AppShell>
  );
}
