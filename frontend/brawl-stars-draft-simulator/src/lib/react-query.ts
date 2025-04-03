import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 24 * 60 * 60 * 1000, // 1 minute
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});