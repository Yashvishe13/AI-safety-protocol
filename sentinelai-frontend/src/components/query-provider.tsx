"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * React Query provider component
 * Provides data fetching and caching capabilities throughout the app
 */
interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a new QueryClient instance for each provider
  // This prevents sharing state between different app instances
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: How long cached data remains fresh
            staleTime: 60 * 1000, // 1 minute
            // GC time: How long inactive queries stay in cache
            gcTime: 5 * 60 * 1000, // 5 minutes
            // Retry failed requests
            retry: (failureCount, error) => {
              // Don't retry 4xx errors (client errors)
              if (error && typeof error === "object" && "status" in error) {
                const status = (error as { status: number }).status;
                if (status >= 400 && status < 500) return false;
              }
              // Retry up to 3 times for other errors
              return failureCount < 3;
            },
            // Refetch on window focus (can be disabled for better UX)
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
