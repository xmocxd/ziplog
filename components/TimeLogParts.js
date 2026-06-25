import { Pressable, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import { useRunningElapsedMinutes } from '../hooks/useRunningMinuteTick';
import { formatRunningMinutes } from '../utils/time';
import { hexWithAlpha } from '../utils/taskColors';

export function TaskSplitButton({
  taskName,
  taskColor,
  isRunning,
  isBlocked,
  runningStartTime,
  showLiveElapsed,
  onStartStop,
  onSetTime,
}) {
  const leftDisabled = isBlocked && !isRunning;
  const runningMinutes = useRunningElapsedMinutes(runningStartTime, isRunning && showLiveElapsed);

  const leftBg = isRunning
    ? { backgroundColor: hexWithAlpha(taskColor, 0.2) }
    : leftDisabled
      ? { backgroundColor: theme.cardMuted }
      : { backgroundColor: theme.card };

  return (
    <View className="flex-row overflow-hidden rounded-2xl border border-app-border">
      <Pressable
        className="flex-1 px-4 py-4 active:opacity-85"
        style={[leftBg, isRunning ? { borderLeftWidth: 4, borderLeftColor: taskColor } : null]}
        onPress={onStartStop}
        disabled={leftDisabled}
      >
        <Text
          className="text-base font-semibold"
          style={{ color: leftDisabled ? theme.textDim : taskColor }}
        >
          {taskName}
        </Text>
        <Text className={`mt-1 text-sm ${leftDisabled ? 'text-app-dim' : 'text-app-muted'}`}>
          {isRunning
            ? showLiveElapsed
              ? `Stop · ${formatRunningMinutes(runningMinutes)}`
              : 'Stop'
            : 'Start now'}
        </Text>
      </Pressable>
      <Pressable
        className={`flex-1 items-center justify-center border-l border-app-border px-2 py-4 active:bg-app-surface ${
          leftDisabled ? 'bg-app-surface/50' : 'bg-app-card'
        }`}
        onPress={onSetTime}
        disabled={leftDisabled}
      >
        <Text className={`text-sm font-semibold ${leftDisabled ? 'text-app-dim' : 'text-app-text'}`}>
          {isRunning ? 'Set end' : 'Set start'}
        </Text>
        <Text className={`mt-1 text-xs ${leftDisabled ? 'text-app-dim' : 'text-app-muted'}`}>
          hr : min
        </Text>
      </Pressable>
    </View>
  );
}
