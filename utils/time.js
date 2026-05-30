export function formatTime24(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
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

export function durationToDisplay(minutes) {
  if (minutes % 60 === 0 && minutes >= 60) return `${minutes / 60} hr`;
  return `${minutes} min`;
}

export function parseClockTimeInput(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const colonMatch = trimmed.match(/^(\d{1,2}):(\d{1,2})$/);
  if (colonMatch) {
    const hours = Number.parseInt(colonMatch[1], 10);
    const minutes = Number.parseInt(colonMatch[2], 10);
    if (hours > 23 || minutes > 59) return null;
    return formatClockTimeValue(hours, minutes);
  }

  const hourOnlyMatch = trimmed.match(/^(\d{1,2})$/);
  if (hourOnlyMatch) {
    const hours = Number.parseInt(hourOnlyMatch[1], 10);
    if (hours > 23) return null;
    return formatClockTimeValue(hours, 0);
  }

  return null;
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

export function parseStartTimeInput(value) {
  const clockTime = parseClockTimeInput(value);
  if (!clockTime) return null;

  const { hours, minutes } = parseClockTimeValue(clockTime);
  return buildStartDate(hours, minutes);
}

export function parseDurationInput(value) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  const colonMatch = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    const hours = Number.parseInt(colonMatch[1], 10);
    const minutes = Number.parseInt(colonMatch[2], 10);
    if (minutes > 59) return null;
    const total = hours * 60 + minutes;
    return total > 0 ? total : null;
  }

  const unitMatch = trimmed.match(/^([\d.]+)\s*(hrs?|mins?)$/);
  if (unitMatch) {
    const amount = Number.parseFloat(unitMatch[1]);
    if (Number.isNaN(amount) || amount <= 0) return null;
    return Math.round(unitMatch[2].startsWith('hr') ? amount * 60 : amount);
  }

  const plainNumberMatch = trimmed.match(/^([\d.]+)$/);
  if (plainNumberMatch) {
    const hours = Number.parseFloat(plainNumberMatch[1]);
    if (Number.isNaN(hours) || hours <= 0) return null;
    return Math.round(hours * 60);
  }

  return null;
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

export function calculateAlarmTime({
  startTime,
  driveTimeMinutes,
  maxRushHourAllowanceMinutes,
  peakStartTime,
  peakEndTime,
  readyTimeMinutes,
}) {
  const rushHour = calculateRushAllowanceFromCurve({
    startTime,
    peakStartTime,
    peakEndTime,
    maxAllowanceMinutes: maxRushHourAllowanceMinutes,
  });

  const totalOffsetMs =
    (driveTimeMinutes + readyTimeMinutes + rushHour.effectiveMinutes) * 60000;
  const alarmTime = new Date(startTime.getTime() - totalOffsetMs);

  return {
    alarmTime,
    breakdown: {
      startTime,
      driveTimeMinutes,
      readyTimeMinutes,
      rushHourAllowanceMinutes: rushHour.effectiveMinutes,
      rushHour,
    },
  };
}

export function formatAlarmEquation(breakdown, alarmTime) {
  const start = formatTime24(breakdown.startTime);
  const rush = formatDuration(breakdown.rushHourAllowanceMinutes);
  const drive = formatDuration(breakdown.driveTimeMinutes);
  const ready = formatDuration(breakdown.readyTimeMinutes);
  const alarm = formatTime24(alarmTime);
  return `${start} Start − ${rush} Rush Hour − ${drive} Drive − ${ready} to Get Ready = ${alarm} Alarm`;
}

export const START_TIME_HINT = 'Start time examples: 7 (07:00), 07:00, 19:30 (24-hour time)';
export const DURATION_HINT = 'Duration examples: 1 (1 hr), 30 min, 1 hr, 1:30 (1 hr 30 min)';
