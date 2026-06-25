import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  createTimeLogEntry,
  loadTimeLogData,
  saveTimeLogEntries,
  saveTaskTypes,
} from '../storage/timeLogStore';
import { assignColorsToTaskTypes } from '../utils/taskColors';
import { getRunningElapsedMinutes, isOverMaxDuration, MAX_TASK_MINUTES } from '../utils/time';

const VISIBLE_ENTRY_LIMIT = 15;

function stripOver24hRunning(entries) {
  const kept = [];
  let removed = false;
  for (const entry of entries) {
    if (entry.endTime == null && getRunningElapsedMinutes(entry.startTime) > MAX_TASK_MINUTES) {
      removed = true;
      continue;
    }
    kept.push(entry);
  }
  return { entries: kept, removed };
}

function normalizeEntries(entries) {
  return entries.map((entry) => ({
    ...entry,
    createdAt: entry.createdAt ?? entry.startTime,
    adjustedMinutes: entry.adjustedMinutes ?? 0,
    isLiveTimer: entry.isLiveTimer ?? false,
  }));
}

/** Loads time log data. entriesRef keeps async saves in sync with the latest list. */
export function useTimeLog() {
  const [taskTypes, setTaskTypes] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [over24hRemoved, setOver24hRemoved] = useState(false);
  const entriesRef = useRef(entries);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadTimeLogData();
      const coloredTypes = assignColorsToTaskTypes(data.taskTypes);
      if (JSON.stringify(coloredTypes) !== JSON.stringify(data.taskTypes)) {
        await saveTaskTypes(coloredTypes);
      }
      setTaskTypes(coloredTypes);

      const needsMigration = data.entries.some((e) => !e.createdAt);
      const normalized = normalizeEntries(data.entries);
      const { entries: cleaned, removed } = stripOver24hRunning(normalized);
      if (removed || needsMigration) {
        await saveTimeLogEntries(cleaned);
      }
      if (removed) {
        setOver24hRemoved(true);
      }
      entriesRef.current = cleaned;
      setEntries(cleaned);
    } catch (error) {
      console.error('Failed to load time log:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const writeEntries = useCallback(async (next) => {
    try {
      const saved = await saveTimeLogEntries(next);
      entriesRef.current = saved;
      setEntries(saved);
      return saved;
    } catch (error) {
      console.error('Failed to save time log entries:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const runningEntry = useMemo(
    () => entries.find((entry) => entry.endTime == null) ?? null,
    [entries],
  );

  const checkRunningEntry = useCallback(async () => {
    const current = entriesRef.current;
    const running = current.find((entry) => entry.endTime == null);
    if (!running) return;
    if (getRunningElapsedMinutes(running.startTime) <= MAX_TASK_MINUTES) return;

    const next = current.filter((e) => e.id !== running.id);
    await writeEntries(next);
    setOver24hRemoved(true);
  }, [writeEntries]);

  useEffect(() => {
    if (!runningEntry) return;
    const interval = setInterval(checkRunningEntry, 60_000);
    return () => clearInterval(interval);
  }, [runningEntry, checkRunningEntry]);

  const prependEntry = useCallback(
    async (entry) => {
      const next = [entry, ...entriesRef.current];
      await writeEntries(next);
    },
    [writeEntries],
  );

  const startTask = useCallback(
    async (taskTypeId, startTime) => {
      if (entriesRef.current.some((e) => e.endTime == null)) {
        return { ok: false, reason: 'running' };
      }
      const taskType = taskTypes.find((t) => t.id === taskTypeId);
      if (!taskType) return { ok: false, reason: 'missing' };

      const isLiveTimer = startTime === undefined;
      const start = startTime ?? new Date();
      if (start.getTime() > Date.now()) return { ok: false, reason: 'future' };
      if (isOverMaxDuration(start)) return { ok: false, reason: 'over24h' };

      await prependEntry(
        createTimeLogEntry({
          taskTypeId,
          name: taskType.name,
          startTime: start,
          isLiveTimer,
        }),
      );
      return { ok: true };
    },
    [prependEntry, taskTypes],
  );

  const stopTask = useCallback(
    async (taskTypeId, endTime = new Date()) => {
      const current = entriesRef.current;
      const entry = current.find((e) => e.taskTypeId === taskTypeId && e.endTime == null);
      if (!entry) return { ok: false, reason: 'not-running' };
      if (endTime.getTime() <= new Date(entry.startTime).getTime()) {
        return { ok: false, reason: 'before-start' };
      }
      if (isOverMaxDuration(entry.startTime, endTime)) {
        await writeEntries(current.filter((e) => e.id !== entry.id));
        setOver24hRemoved(true);
        return { ok: false, reason: 'over24h' };
      }

      const next = current.map((e) =>
        e.id === entry.id ? { ...e, endTime: endTime.toISOString() } : e,
      );
      await writeEntries(next);
      return { ok: true };
    },
    [writeEntries],
  );

  const addManualBlock = useCallback(
    async (taskTypeId, durationMinutes) => {
      if (durationMinutes <= 0) return { ok: false, reason: 'invalid' };
      if (durationMinutes > MAX_TASK_MINUTES) return { ok: false, reason: 'over24h' };
      const taskType = taskTypes.find((t) => t.id === taskTypeId);
      if (!taskType) return { ok: false, reason: 'missing' };

      const end = new Date();
      const start = new Date(end.getTime() - durationMinutes * 60000);
      await prependEntry(
        createTimeLogEntry({
          taskTypeId,
          name: taskType.name,
          startTime: start,
          endTime: end,
          isManualBlock: true,
        }),
      );
      return { ok: true };
    },
    [prependEntry, taskTypes],
  );

  const updateEntry = useCallback(
    async (id, updates) => {
      const next = entriesRef.current.map((e) => (e.id === id ? { ...e, ...updates } : e));
      await writeEntries(next);
    },
    [writeEntries],
  );

  const adjustEntryDuration = useCallback(
    async (id, deltaMinutes) => {
      const entry = entriesRef.current.find((e) => e.id === id);
      if (!entry?.endTime) return { ok: false };

      const start = new Date(entry.startTime).getTime();
      const end = new Date(entry.endTime).getTime();
      const currentMinutes = Math.round((end - start) / 60000);
      const nextMinutes = currentMinutes + deltaMinutes;
      if (nextMinutes < 1) return { ok: false, reason: 'below_min' };
      if (nextMinutes > MAX_TASK_MINUTES) return { ok: false, reason: 'over24h' };

      await updateEntry(id, {
        endTime: new Date(start + nextMinutes * 60000).toISOString(),
        adjustedMinutes: (entry.adjustedMinutes || 0) + deltaMinutes,
      });
      return { ok: true };
    },
    [updateEntry],
  );

  const setEntryDuration = useCallback(
    async (id, totalMinutes) => {
      const entry = entriesRef.current.find((e) => e.id === id);
      if (!entry?.endTime) return { ok: false };
      if (totalMinutes < 1) return { ok: false, reason: 'below_min' };
      if (totalMinutes > MAX_TASK_MINUTES) return { ok: false, reason: 'over24h' };

      const start = new Date(entry.startTime).getTime();
      const currentMinutes = Math.round((new Date(entry.endTime).getTime() - start) / 60000);
      const delta = totalMinutes - currentMinutes;

      await updateEntry(id, {
        endTime: new Date(start + totalMinutes * 60000).toISOString(),
        adjustedMinutes: (entry.adjustedMinutes || 0) + delta,
      });
      return { ok: true };
    },
    [updateEntry],
  );

  const deleteEntry = useCallback(
    async (id) => {
      if (!id) return;
      const next = entriesRef.current.filter((e) => e.id !== id);
      await writeEntries(next);
    },
    [writeEntries],
  );

  const clearOver24hFlag = useCallback(() => setOver24hRemoved(false), []);

  const [visibleLimit, setVisibleLimit] = useState(VISIBLE_ENTRY_LIMIT);

  const visibleEntries = entries.slice(0, visibleLimit);
  const hasMoreEntries = entries.length > visibleLimit;
  const loadMoreEntries = useCallback(() => {
    setVisibleLimit((limit) => limit + VISIBLE_ENTRY_LIMIT);
  }, []);

  return {
    taskTypes,
    entries,
    visibleEntries,
    hasMoreEntries,
    loadMoreEntries,
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
    reload: loadData,
  };
}
