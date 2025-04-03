import { DataProvider } from '@components/DataProviderContext';
import '../app/globals.css'; // Ensure this is here to load Tailwind globally
import type { AppProps } from 'next/app';
import ClientLayout from '@components/ClientLayout';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/react-query';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        <ClientLayout>
          <Component {...pageProps} />
        </ClientLayout>
      </DataProvider>
    </QueryClientProvider>
  )
}

export default MyApp;