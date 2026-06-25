import { showAlert } from './dialogs';

const MESSAGES = {
  over24h: ['Task removed', 'A running task exceeded 24 hours and was removed as a possible error.'],
  over24h_stop: ['Task removed', 'This task exceeded 24 hours and was removed as a possible error.'],
  over24h_end: ['Task removed', 'That end time exceeds 24 hours and the entry was removed.'],
  running: ['Task already running', 'Stop the current task before starting another.'],
  future: ['Invalid time', 'Start time cannot be in the future.'],
  start_over24h: ['Invalid time', 'Start time cannot be more than 24 hours ago.'],
  before_start: ['Invalid time', 'End time must be after the start time.'],
  block_over24h: ['Too long', 'A single entry cannot exceed 24 hours.'],
  duration_over24h: ['Too long', 'A single entry cannot exceed 24 hours.'],
  duration_below_min: ['Too short', 'Duration must be at least 1 minute.'],
};

export function showTimeLogMessage(key) {
  const message = MESSAGES[key];
  if (!message) return;
  showAlert(message[0], message[1]);
}
