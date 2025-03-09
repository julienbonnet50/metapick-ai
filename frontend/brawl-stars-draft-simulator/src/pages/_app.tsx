import { DataProvider } from '@components/DataProviderContext';
import '../app/globals.css'; // Ensure this is here to load Tailwind globally
import type { AppProps } from 'next/app';
import ClientLayout from '@components/ClientLayout';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <DataProvider>
      <ClientLayout>
        <Component {...pageProps} />
      </ClientLayout>
    </DataProvider>
  )
}

export default MyApp;