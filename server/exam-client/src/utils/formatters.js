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
