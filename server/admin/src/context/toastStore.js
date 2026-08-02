/**
 * Module-level toast store (pub/sub).
 *
 * Lives outside React so non-component code (e.g., the TanStack Query
 * QueryCache error handler) can publish notifications. ToastProvider
 * subscribes and renders.
 */

let listeners = [];
let toasts = [];
let nextId = 1;

const emit = () => {
  listeners.forEach((listener) => listener(toasts));
};

export const toastStore = {
  getToasts: () => toasts,

  push: ({ type = 'info', message, duration = 4000 } = {}) => {
    if (!message) return null;
    const id = nextId++;
    toasts = [...toasts, { id, type, message, duration }];
    emit();
    if (duration > 0) {
      window.setTimeout(() => toastStore.dismiss(id), duration);
    }
    return id;
  },

  dismiss: (id) => {
    toasts = toasts.filter((toast) => toast.id !== id);
    emit();
  },

  clear: () => {
    toasts = [];
    emit();
  },

  subscribe: (listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((entry) => entry !== listener);
    };
  },
};

export default toastStore;
