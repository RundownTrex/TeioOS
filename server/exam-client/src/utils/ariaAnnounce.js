/**
 * Programmatic announcer for screen readers (Orca, NVDA, VoiceOver)
 * Triggers announcements by dynamically updating DOM aria-live regions.
 *
 * @param {string} message - The text message to announce to screen readers.
 * @param {'polite'|'assertive'} priority - Priority level for the announcement.
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const regionId = priority === 'assertive' ? 'aria-live-assertive' : 'aria-live-polite';
  const region = document.getElementById(regionId);

  if (region) {
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;
    }, 100);
  }
};
