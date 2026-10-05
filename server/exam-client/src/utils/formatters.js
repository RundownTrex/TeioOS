/**
 * Format seconds into HH:MM:SS or MM:SS format for exam timer display.
 *
 * @param {number} totalSeconds - Total remaining duration in seconds.
 * @returns {string} Formatted duration string.
 */
export const formatDuration = (totalSeconds) => {
  if (totalSeconds < 0 || isNaN(totalSeconds)) return '00:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (num) => String(num).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};

/**
 * Format seconds into a natural human-spoken duration string for screen readers and TTS.
 * E.g., "1 hour, 24 minutes, and 15 seconds", "45 minutes", "30 seconds".
 *
 * @param {number} totalSeconds - Total remaining duration in seconds.
 * @returns {string} Natural spoken duration string.
 */
export const formatSpokenDuration = (totalSeconds) => {
  if (totalSeconds <= 0 || isNaN(totalSeconds)) {
    return '0 seconds';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const parts = [];
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
  }

  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts[0]}, ${parts[1]}, and ${parts[2]}`;
};

/**
 * Format ISO Date string into localized human-readable time.
 *
 * @param {string} isoString - ISO formatted timestamp string.
 * @returns {string} Formatted date and time string.
 */
export const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch (error) {
    return isoString;
  }
};
