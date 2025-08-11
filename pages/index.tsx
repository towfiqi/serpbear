import type { NextPage } from 'next';
import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Icon from '../components/common/Icon';

const Home: NextPage = () => {
   const router = useRouter();
   useEffect(() => {
      if (router) router.push('/domains');
   }, [router]);

  return (
    <div>
      <Head>
        <title>SerpBear</title>
        <meta name="description" content="SerpBear Google Keyword Position Tracking App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main role={'main'} className='main flex items-center justify-center w-full min-h-screen'>
        <Icon type='loading' size={36} color="#999" />
      </main>
    </div>
  );
};

export default Home;
