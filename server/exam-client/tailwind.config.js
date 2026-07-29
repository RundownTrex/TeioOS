/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      colors: {
        canvas: 'var(--color-bg-canvas)',
        surface: 'var(--color-bg-surface)',
        subtle: 'var(--color-bg-subtle)',
        
        'text-main': 'var(--color-text-main)',
        'text-muted': 'var(--color-text-muted)',
        'text-inverse': 'var(--color-text-inverse)',
        
        'border-main': 'var(--color-border-main)',
        'border-strong': 'var(--color-border-strong)',
        
        navy: {
          primary: 'var(--color-navy-primary)',
          hover: 'var(--color-navy-hover)',
          active: 'var(--color-navy-active)',
        },

        status: {
          answered: 'var(--color-status-answered)',
          'answered-bg': 'var(--color-status-answered-bg)',
          unanswered: 'var(--color-status-unanswered)',
          'unanswered-bg': 'var(--color-status-unanswered-bg)',
          review: 'var(--color-status-review)',
          'review-bg': 'var(--color-status-review-bg)',
          unvisited: 'var(--color-status-unvisited)',
          'unvisited-bg': 'var(--color-status-unvisited-bg)',
        },
      },
      fontFamily: {
        sans: ['var(--font-family-sans)'],
        mono: ['var(--font-family-mono)'],
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
      boxShadow: {
        none: 'var(--shadow-none)',
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      maxWidth: {
        login: 'var(--dim-login-width)',
        dashboard: 'var(--dim-dashboard-width)',
        reading: 'var(--dim-reading-width)',
        workbench: 'var(--dim-workbench-width)',
      },
      width: {
        sidebar: 'var(--dim-sidebar-width)',
      },
      height: {
        header: 'var(--dim-header-height)',
        footer: 'var(--dim-footer-height)',
        'header-sm': '2.25rem',
      },
      zIndex: {
        base: 'var(--z-base)',
        sticky: 'var(--z-sticky)',
        header: 'var(--z-header)',
        sidebar: 'var(--z-sidebar)',
        backdrop: 'var(--z-backdrop)',
        modal: 'var(--z-modal)',
        'skip-link': 'var(--z-skip-link)',
        announcer: 'var(--z-announcer)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        'in-out': 'var(--ease-in-out)',
        out: 'var(--ease-out)',
        linear: 'var(--ease-linear)',
      },
    },
  },
  plugins: [],
}
