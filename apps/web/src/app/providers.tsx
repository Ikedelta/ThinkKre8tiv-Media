'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ConfirmProvider } from '@/components/providers/ConfirmProvider';
import { ThemeProvider } from 'next-themes';

// Create a client that persists across re-renders
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // High-performance caching defaults
        staleTime: 60 * 1000, // 1 minute fresh cache
        gcTime: 5 * 60 * 1000, // 5 minutes garbage collection persistence
        refetchOnWindowFocus: false, // Prevents wasteful background network waterfalls on tab switch
        refetchOnReconnect: false,
        retry: 1, // Fail fast rather than multiple slow blocking retries
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function Providers({ children }: { children: ReactNode }) {
  // Initialize query client once
  const [queryClient] = useState(() => getQueryClient());
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={isAdminRoute}
      forcedTheme={isAdminRoute ? undefined : 'light'}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <ConfirmProvider>
          {children}
          <Toaster position="bottom-right" />
        </ConfirmProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
