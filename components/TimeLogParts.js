import { Pressable, Text, View } from 'react-native';

import { useRunningElapsedMinutes } from '../hooks/useRunningMinuteTick';
import { formatRunningMinutes } from '../utils/time';
import { hexWithAlpha } from '../utils/taskColors';

export function TaskSplitButton({
  taskName,
  taskColor,
  isRunning,
  isBlocked,
  runningStartTime,
  onStartStop,
  onSetTime,
}) {
  const leftDisabled = isBlocked && !isRunning;
  const runningMinutes = useRunningElapsedMinutes(runningStartTime, isRunning);
  const bgStyle = isRunning
    ? { backgroundColor: hexWithAlpha(taskColor, 0.18) }
    : leftDisabled
      ? { backgroundColor: '#f3f4f6' }
      : { backgroundColor: '#ffffff' };

  return (
    <View className="flex-row overflow-hidden rounded-xl border border-gray-200">
      <Pressable
        className="flex-1 px-4 py-4 active:opacity-80"
        style={[bgStyle, isRunning ? { borderLeftWidth: 4, borderLeftColor: taskColor } : null]}
        onPress={onStartStop}
        disabled={leftDisabled}
      >
        <Text
          className="text-base font-semibold"
          style={{ color: leftDisabled ? '#9ca3af' : taskColor }}
        >
          {taskName}
        </Text>
        <Text
          className={`mt-1 text-sm ${leftDisabled ? 'text-gray-400' : 'text-gray-600'}`}
        >
          {isRunning ? `Stop · ${formatRunningMinutes(runningMinutes)}` : 'Start now'}
        </Text>
      </Pressable>
      <Pressable
        className={`flex-1 items-center justify-center border-l border-gray-200 px-2 py-4 active:bg-gray-50 ${
          leftDisabled ? 'bg-gray-100' : 'bg-white'
        }`}
        onPress={onSetTime}
        disabled={leftDisabled}
      >
        <Text className={`text-sm font-semibold ${leftDisabled ? 'text-gray-400' : 'text-gray-800'}`}>
          {isRunning ? 'Set end' : 'Set start'}
        </Text>
        <Text className={`mt-1 text-xs ${leftDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
          hr : min
        </Text>
      </Pressable>
    </View>
  );
}
