export function formatTime24(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatShortDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function getLocalDayKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDaySectionHeader(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export function getEntryMinutesForTotals(entry) {
  if (entry?.endTime) return getEntryDurationMinutes(entry) ?? 0;
  if (entry?.isLiveTimer) return getRunningElapsedMinutes(entry.startTime);
  return 0;
}

export function computeDayCategoryTotals(dayKey, allEntries, taskTypes) {
  const totalsByType = new Map();

  for (const entry of allEntries) {
    if (getLocalDayKey(entry.startTime) !== dayKey) continue;
    const minutes = getEntryMinutesForTotals(entry);
    if (minutes <= 0) continue;
    totalsByType.set(entry.taskTypeId, (totalsByType.get(entry.taskTypeId) || 0) + minutes);
  }

  return taskTypes
    .map((task) => ({
      taskTypeId: task.id,
      name: task.name,
      color: task.color,
      minutes: totalsByType.get(task.id) || 0,
    }))
    .filter((task) => task.minutes > 0);
}

export function groupEntriesByDay(visibleEntries) {
  const sections = [];
  let currentDayKey = null;
  let currentEntries = [];

  for (const entry of visibleEntries) {
    const dayKey = getLocalDayKey(entry.startTime);
    if (dayKey !== currentDayKey) {
      if (currentEntries.length > 0) {
        sections.push({ dayKey: currentDayKey, entries: currentEntries });
      }
      currentDayKey = dayKey;
      currentEntries = [entry];
    } else {
      currentEntries.push(entry);
    }
  }

  if (currentEntries.length > 0) {
    sections.push({ dayKey: currentDayKey, entries: currentEntries });
  }

  return sections;
}

export function getEntryDurationMinutes(entry) {
  if (!entry?.startTime || !entry?.endTime) return null;
  const start = new Date(entry.startTime).getTime();
  const end = new Date(entry.endTime).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return Math.round((end - start) / 60000);
}

export function getRunningElapsedMinutes(startTime) {
  const start = new Date(startTime).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.round((Date.now() - start) / 60000);
}

export function formatRunningMinutes(minutes) {
  return `${minutes} min`;
}

export const MAX_TASK_MINUTES = 24 * 60;

export function isOverMaxDuration(startTime, endTime = Date.now()) {
  const start = new Date(startTime).getTime();
  const end = endTime instanceof Date ? endTime.getTime() : new Date(endTime).getTime();
  return end - start > MAX_TASK_MINUTES * 60000;
}

export function buildPastDateFromHrMin(hours, minutes) {
  const h = Number(hours) || 0;
  const m = Number(minutes) || 0;
  if (h > 23 || m > 59) return null;
  const date = new Date();
  date.setSeconds(0, 0);
  date.setHours(h, m, 0, 0);
  if (date.getTime() > Date.now()) date.setDate(date.getDate() - 1);
  return date;
}

export function buildEndDateFromHrMin(hours, minutes, startTime) {
  const h = Number(hours) || 0;
  const m = Number(minutes) || 0;
  if (h > 23 || m > 59) return null;

  const start = new Date(startTime);
  const end = new Date(start);
  end.setSeconds(0, 0);
  end.setHours(h, m, 0, 0);
  if (end.getTime() <= start.getTime()) end.setDate(end.getDate() + 1);
  if (end.getTime() > Date.now()) return null;
  if (isOverMaxDuration(start, end)) return null;
  return end;
}

export function dateToHrMinString(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return { hours: '', minutes: '' };
  return { hours: String(d.getHours()), minutes: String(d.getMinutes()) };
}

export function formatDuration(minutes) {
  if (minutes % 60 === 0 && minutes >= 60) {
    const hours = minutes / 60;
    return hours === 1 ? '1 hr' : `${hours} hr`;
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    const hourLabel = hours === 1 ? '1 hr' : `${hours} hr`;
    return `${hourLabel} ${remainder} min`;
  }
  return `${minutes} min`;
}

export function minutesToHrMin(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

export function hrMinToMinutes(hours, minutes) {
  return (Number(hours) || 0) * 60 + (Number(minutes) || 0);
}

export function formatClockTimeValue(hours, minutes = 0) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function parseClockTimeValue(value) {
  const match = value?.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  return {
    hours: Number.parseInt(match[1], 10),
    minutes: Number.parseInt(match[2], 10),
  };
}

export function buildStartDateFromHrMin(hours, minutes) {
  const h = Number(hours) || 0;
  const m = Number(minutes) || 0;
  if (h > 23 || m > 59) return null;
  return buildStartDate(h, m);
}

function buildStartDate(hours, minutes) {
  const date = new Date();
  date.setSeconds(0, 0);
  date.setHours(hours, minutes, 0, 0);
  if (date.getTime() <= Date.now()) date.setDate(date.getDate() + 1);
  return date;
}

export function minutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function clockTimeToMinutes(clockTime) {
  const parsed = parseClockTimeValue(clockTime);
  if (!parsed) return null;
  return parsed.hours * 60 + parsed.minutes;
}

export function minutesToClockTime(totalMinutes) {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  return formatClockTimeValue(Math.floor(normalized / 60), normalized % 60);
}

const RUSH_RAMP_UP_LEAD_MINUTES = 60;
const RUSH_RAMP_UP_TAIL_MINUTES = 15;
const RUSH_RAMP_DOWN_LEAD_MINUTES = 15;
const RUSH_RAMP_DOWN_TAIL_MINUTES = 60;
const PEAK_SHOULDER_PERCENT = 0.75;

function smoothstep(value, start, end, startOutput, endOutput) {
  if (value <= start) return startOutput;
  if (value >= end) return endOutput;
  const x = (value - start) / (end - start);
  const eased = x * x * (3 - 2 * x);
  return startOutput + eased * (endOutput - startOutput);
}

function getRampUpEnvelope(minutes, peakStartMinutes) {
  const rampUpStart = peakStartMinutes - RUSH_RAMP_UP_LEAD_MINUTES;
  const rampUpEnd = peakStartMinutes + RUSH_RAMP_UP_TAIL_MINUTES;

  if (minutes < rampUpStart) return 0;
  if (minutes <= peakStartMinutes) {
    return smoothstep(minutes, rampUpStart, peakStartMinutes, 0, PEAK_SHOULDER_PERCENT);
  }
  if (minutes <= rampUpEnd) {
    return smoothstep(minutes, peakStartMinutes, rampUpEnd, PEAK_SHOULDER_PERCENT, 1);
  }
  return 1;
}

function getRampDownEnvelope(minutes, peakEndMinutes) {
  const rampDownStart = peakEndMinutes - RUSH_RAMP_DOWN_LEAD_MINUTES;
  const rampDownEnd = peakEndMinutes + RUSH_RAMP_DOWN_TAIL_MINUTES;

  if (minutes > rampDownEnd) return 0;
  if (minutes >= peakEndMinutes) {
    return smoothstep(minutes, peakEndMinutes, rampDownEnd, PEAK_SHOULDER_PERCENT, 0);
  }
  if (minutes >= rampDownStart) {
    return smoothstep(minutes, rampDownStart, peakEndMinutes, 1, PEAK_SHOULDER_PERCENT);
  }
  return 1;
}

export function calculateRushAllowanceFromCurve({
  startTime,
  peakStartTime,
  peakEndTime,
  maxAllowanceMinutes,
}) {
  const startMinutes = minutesSinceMidnight(startTime);
  const peakStartMinutes = clockTimeToMinutes(peakStartTime);
  const peakEndMinutes = clockTimeToMinutes(peakEndTime);

  const rampUpStartMinutes = peakStartMinutes - RUSH_RAMP_UP_LEAD_MINUTES;
  const rampUpEndMinutes = peakStartMinutes + RUSH_RAMP_UP_TAIL_MINUTES;
  const rampDownStartMinutes = peakEndMinutes - RUSH_RAMP_DOWN_LEAD_MINUTES;
  const rampDownEndMinutes = peakEndMinutes + RUSH_RAMP_DOWN_TAIL_MINUTES;

  const rampUpPercent = getRampUpEnvelope(startMinutes, peakStartMinutes);
  const rampDownPercent = getRampDownEnvelope(startMinutes, peakEndMinutes);
  const curvePercent = Math.min(rampUpPercent, rampDownPercent);

  let phase = 'none';
  if (curvePercent > 0) {
    if (curvePercent === 1) phase = 'peak';
    else if (rampUpPercent <= rampDownPercent) phase = 'ramp-up';
    else phase = 'ramp-down';
  }

  const effectiveMinutes = Math.round(maxAllowanceMinutes * curvePercent);

  return {
    effectiveMinutes,
    maxAllowanceMinutes,
    peakStartTime,
    peakEndTime,
    rampUpStartTime: minutesToClockTime(rampUpStartMinutes),
    rampUpEndTime: minutesToClockTime(rampUpEndMinutes),
    rampDownStartTime: minutesToClockTime(rampDownStartMinutes),
    rampDownEndTime: minutesToClockTime(rampDownEndMinutes),
    phase,
    curvePercent,
    startTimeFormatted: formatTime24(startTime),
  };
}

export function formatRushHourCurveBreakdown(rushHour) {
  const peak = `${rushHour.peakStartTime}–${rushHour.peakEndTime}`;
  const rampUp = `${rushHour.rampUpStartTime}–${rushHour.rampUpEndTime}`;
  const rampDown = `${rushHour.rampDownStartTime}–${rushHour.rampDownEndTime}`;
  const max = formatDuration(rushHour.maxAllowanceMinutes);
  const effective = formatDuration(rushHour.effectiveMinutes);
  const pct = Math.round(rushHour.curvePercent * 100);

  if (rushHour.phase === 'none') {
    return `Rush hour bell curve - start ${rushHour.startTimeFormatted} outside window → 0 min (max ${max}).`;
  }
  if (rushHour.phase === 'peak') {
    return `Rush hour bell curve - start ${rushHour.startTimeFormatted} at full allowance → ${effective} (100% of ${max} max).`;
  }
  if (rushHour.phase === 'ramp-up') {
    return `Rush hour bell curve - start ${rushHour.startTimeFormatted} ramp-up at ${pct}% → ${effective} (${pct}% of ${max} max).`;
  }
  return `Rush hour bell curve - start ${rushHour.startTimeFormatted} ramp-down at ${pct}% → ${effective} (${pct}% of ${max} max).`;
}

export function getTrafficColorClass(minutes) {
  if (minutes === 0) return 'text-app-running';
  if (minutes <= 15) return 'text-amber-400';
  return 'text-app-danger';
}

export function calculateAlarmTime({
  startTime,
  driveTimeMinutes,
  maxRushHourAllowanceMinutes,
  peakStartTime,
  peakEndTime,
  readyTimeMinutes,
  bufferTimeMinutes = 0,
}) {
  const rushHour = calculateRushAllowanceFromCurve({
    startTime,
    peakStartTime,
    peakEndTime,
    maxAllowanceMinutes: maxRushHourAllowanceMinutes,
  });

  const totalOffsetMs =
    (driveTimeMinutes + readyTimeMinutes + bufferTimeMinutes + rushHour.effectiveMinutes) *
    60000;
  const alarmTime = new Date(startTime.getTime() - totalOffsetMs);

  return {
    alarmTime,
    breakdown: {
      startTime,
      driveTimeMinutes,
      readyTimeMinutes,
      bufferTimeMinutes,
      rushHourAllowanceMinutes: rushHour.effectiveMinutes,
      rushHour,
    },
  };
}
