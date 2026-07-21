import { QueryClient } from '@tanstack/react-query';

/**
 * Singleton QueryClient instance, extracted to its own module so it can be
 * imported both by main.tsx (for the provider) and by auth.store.ts (to
 * clear cached data on login/logout transitions, preventing one user's
 * cached data — predictions, check-in history, chat — from ever leaking
 * into another user's session on the same browser tab).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});