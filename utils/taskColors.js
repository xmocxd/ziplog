export const TASK_PALETTE = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#059669',
  '#d97706',
  '#0891b2',
  '#4f46e5',
  '#c026d3',
];

export function colorForTaskIndex(index) {
  return TASK_PALETTE[index % TASK_PALETTE.length];
}

export function assignColorsToTaskTypes(taskTypes) {
  return taskTypes.map((task, index) => ({
    ...task,
    color: task.color || colorForTaskIndex(index),
  }));
}

export function hexWithAlpha(hex, alpha) {
  const normalized = hex.replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
