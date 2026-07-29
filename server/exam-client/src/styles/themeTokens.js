/**
 * Centralized Design Token System (JavaScript Accessor)
 * Single Source of Truth for runtime component theme constants.
 */

export const TOKENS = {
  colors: {
    bg: {
      canvas: 'var(--color-bg-canvas)',
      surface: 'var(--color-bg-surface)',
      subtle: 'var(--color-bg-subtle)',
    },
    text: {
      main: 'var(--color-text-main)',
      muted: 'var(--color-text-muted)',
      inverse: 'var(--color-text-inverse)',
    },
    border: {
      main: 'var(--color-border-main)',
      strong: 'var(--color-border-strong)',
    },
    navy: {
      primary: 'var(--color-navy-primary)',
      hover: 'var(--color-navy-hover)',
      active: 'var(--color-navy-active)',
    },
    status: {
      answered: 'var(--color-status-answered)',
      answeredBg: 'var(--color-status-answered-bg)',
      unanswered: 'var(--color-status-unanswered)',
      unansweredBg: 'var(--color-status-unanswered-bg)',
      review: 'var(--color-status-review)',
      reviewBg: 'var(--color-status-review-bg)',
      unvisited: 'var(--color-status-unvisited)',
      unvisitedBg: 'var(--color-status-unvisited-bg)',
    },
  },

  typography: {
    fontFamily: {
      sans: 'var(--font-family-sans)',
      mono: 'var(--font-family-mono)',
    },
    fontSize: {
      xs: 'var(--font-size-xs)',
      sm: 'var(--font-size-sm)',
      base: 'var(--font-size-base)',
      lg: 'var(--font-size-lg)',
      xl: 'var(--font-size-xl)',
      '2xl': 'var(--font-size-2xl)',
      '3xl': 'var(--font-size-3xl)',
    },
    fontWeight: {
      normal: 'var(--font-weight-normal)',
      medium: 'var(--font-weight-medium)',
      semibold: 'var(--font-weight-semibold)',
      bold: 'var(--font-weight-bold)',
    },
    lineHeight: {
      tight: 'var(--line-height-tight)',
      normal: 'var(--line-height-normal)',
      relaxed: 'var(--line-height-relaxed)',
    },
  },

  spacing: {
    0: 'var(--spacing-0)',
    1: 'var(--spacing-1)',
    2: 'var(--spacing-2)',
    3: 'var(--spacing-3)',
    4: 'var(--spacing-4)',
    5: 'var(--spacing-5)',
    6: 'var(--spacing-6)',
    8: 'var(--spacing-8)',
    10: 'var(--spacing-10)',
    12: 'var(--spacing-12)',
    16: 'var(--spacing-16)',
  },

  borderRadius: {
    none: 'var(--radius-none)',
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    full: 'var(--radius-full)',
  },

  shadows: {
    none: 'var(--shadow-none)',
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
  },

  focusRing: {
    color: 'var(--focus-ring-color)',
    width: 'var(--focus-ring-width)',
    offset: 'var(--focus-ring-offset)',
    shadow: 'var(--focus-ring-shadow)',
  },

  transitions: {
    duration: {
      fast: 'var(--duration-fast)',
      normal: 'var(--duration-normal)',
      slow: 'var(--duration-slow)',
    },
    easing: {
      easeInOut: 'var(--ease-in-out)',
      easeOut: 'var(--ease-out)',
      linear: 'var(--ease-linear)',
    },
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },

  dimensions: {
    loginWidth: 'var(--dim-login-width)',
    dashboardWidth: 'var(--dim-dashboard-width)',
    readingWidth: 'var(--dim-reading-width)',
    workbenchWidth: 'var(--dim-workbench-width)',
    sidebarWidth: 'var(--dim-sidebar-width)',
    headerHeight: 'var(--dim-header-height)',
    footerHeight: 'var(--dim-footer-height)',
  },

  zIndex: {
    base: 'var(--z-base)',
    sticky: 'var(--z-sticky)',
    header: 'var(--z-header)',
    sidebar: 'var(--z-sidebar)',
    backdrop: 'var(--z-backdrop)',
    modal: 'var(--z-modal)',
    skipLink: 'var(--z-skip-link)',
    announcer: 'var(--z-announcer)',
  },
};

export default TOKENS;
