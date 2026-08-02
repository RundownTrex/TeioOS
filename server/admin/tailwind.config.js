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

          success: 'var(--color-status-success)',
          'success-bg': 'var(--color-status-success-bg)',
          'success-border': 'var(--color-status-success-border)',
          warning: 'var(--color-status-warning)',
          'warning-bg': 'var(--color-status-warning-bg)',
          'warning-border': 'var(--color-status-warning-border)',
          danger: 'var(--color-status-danger)',
          'danger-bg': 'var(--color-status-danger-bg)',
          'danger-border': 'var(--color-status-danger-border)',
          info: 'var(--color-status-info)',
          'info-bg': 'var(--color-status-info-bg)',
          'info-border': 'var(--color-status-info-border)',
          neutral: 'var(--color-status-neutral)',
          'neutral-bg': 'var(--color-status-neutral-bg)',
          'neutral-border': 'var(--color-status-neutral-border)',
        },

        btn: {
          danger: 'var(--color-btn-danger)',
          'danger-hover': 'var(--color-btn-danger-hover)',
          'danger-active': 'var(--color-btn-danger-active)',
        },

        overlay: 'var(--color-overlay)',
        'navy-tint': 'var(--color-navy-tint)',
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
        'dialog-sm': 'var(--dim-dialog-sm)',
        'dialog-md': 'var(--dim-dialog-md)',
        'dialog-lg': 'var(--dim-dialog-lg)',
      },
      width: {
        sidebar: 'var(--dim-sidebar-width)',
      },
      height: {
        header: 'var(--dim-header-height)',
        footer: 'var(--dim-footer-height)',
        'header-sm': '2.25rem',
        'table-header': 'var(--dim-table-header)',
        'table-row': 'var(--dim-table-row)',
        toolbar: 'var(--dim-toolbar)',
        pagination: 'var(--dim-pagination)',
      },
      zIndex: {
        base: 'var(--z-base)',
        sticky: 'var(--z-sticky)',
        header: 'var(--z-header)',
        sidebar: 'var(--z-sidebar)',
        dropdown: 'var(--z-dropdown)',
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
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(100%)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-100%)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in var(--duration-fast) var(--ease-out) both',
        'slide-up': 'slide-up var(--duration-normal) var(--ease-out) both',
        'scale-in': 'scale-in var(--duration-fast) var(--ease-out) both',
      },
    },
  },
  plugins: [],
}
