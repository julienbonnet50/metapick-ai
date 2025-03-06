import '../app/globals.css'; // Ensure this is here to load Tailwind globally
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;