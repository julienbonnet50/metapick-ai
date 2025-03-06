import Head from 'next/head';
import StarDrop from '../app/components/StarDropSimulator';
import ClientLayout from '@components/ClientLayout';

export default function Home() {
  return (
    <ClientLayout>
        <div className="min-h-screen flex items-center justify-center">
            <Head>
                <title>Star Drop Simulator</title>
                <meta name="description" content="Simulate a Star Drop from Brawl Stars!" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className=" p-6 rounded-lg shadow-lg">
                <StarDrop />
            </main>
        </div>
    </ClientLayout>
    
  );
}
