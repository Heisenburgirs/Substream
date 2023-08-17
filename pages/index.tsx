import type { NextPage } from 'next';
import Head from 'next/head';
import { Header } from '../components/Header';

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Substream</title>
        <meta
          content="Stream Gated Communities"
          name="Stream Gated Communities"
        />
      </Head>

      <main>
        <Header />
      </main>
    </div>
  );
};

export default Home;
