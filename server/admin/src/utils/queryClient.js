import { QueryCache, QueryClient } from '@tanstack/react-query';
import { toastStore } from '../context/toastStore';
import { QUERY_DEFAULTS } from './constants';

const lastToastByMessage = new Map();

const shouldSurfaceViaToast = (error) => {
  if (!error) return false;
  if (!error.status) return true;
  return error.status >= 500;
};

const handleQueryError = (error, query) => {
  if (!shouldSurfaceViaToast(error)) return;
  const message = error?.message || 'An unexpected error occurred.';
  const now = Date.now();
  const lastShown = lastToastByMessage.get(message);
  if (lastShown && now - lastShown < QUERY_DEFAULTS.TOAST_DEDUPE_WINDOW_MS) return;
  lastToastByMessage.set(message, now);
  toastStore.push({ type: 'error', message });
};

export const createQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({ onError: handleQueryError }),
    defaultOptions: {
      queries: {
        retry: QUERY_DEFAULTS.RETRY,
        refetchOnWindowFocus: false,
        gcTime: QUERY_DEFAULTS.GC_TIME_MS,
      },
      mutations: {
        retry: 0,
      },
    },
  });

export default createQueryClient;
