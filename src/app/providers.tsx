import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { TokenRefresher } from '@/components/auth/TokenRefresher'
import { Toaster } from 'sonner'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 0,
            gcTime: 1000 * 60 * 5,
          },
        },
      }),
  )

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TokenRefresher />
        {children}
        <Toaster
          richColors
          position="top-right"
          closeButton
          theme="system"
          duration={3000}
          visibleToasts={3}
          toastOptions={{
            style: { fontSize: '16px', padding: '14px 18px', borderRadius: '14px' },
            className: 'font-medium',
          }}
        />
      </QueryClientProvider>
    </HelmetProvider>
  )
}
