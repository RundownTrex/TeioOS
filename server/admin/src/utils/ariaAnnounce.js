/**
 * Screen reader announcement helper.
 * Uses the global live regions mounted by AppShell.
 */

export const announceToScreenReader = (message, priority = 'polite') => {
  const regionId = priority === 'assertive' ? 'aria-live-assertive' : 'aria-live-polite';
  const region = document.getElementById(regionId);
  if (region) {
    region.textContent = '';
    window.setTimeout(() => {
      region.textContent = message;
    }, 50);
  }
};

export default announceToScreenReader;
