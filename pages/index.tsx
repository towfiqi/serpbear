import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
// import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Icon from '../components/common/Icon';
import AddDomain from '../components/domains/AddDomain';

// import verifyUser from '../utils/verifyUser';

const Home: NextPage = () => {
   const [loading, setLoading] = useState<boolean>(false);
   const [domains, setDomains] = useState<Domain[]>([]);
   const router = useRouter();
   useEffect(() => {
      setLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/domains`)
      .then((result) => {
         if (result.status === 401) {
            router.push('/login');
         }
         return result.json();
      })
      .then((domainsRes:any) => {
         if (domainsRes?.domains && domainsRes.domains.length > 0) {
               const firstDomainItem = domainsRes.domains[0].slug;
               setDomains(domainsRes.domains);
               router.push(`/domain/${firstDomainItem}`);
         }
         setLoading(false);
         return false;
      })
      .catch((err) => {
         console.log(err);
         setLoading(false);
      });
   }, [router]);

  return (
    <div>
      <Head>
        <title>SerpBear</title>
        <meta name="description" content="SerpBear Google Keyword Position Tracking App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main role={'main'} className='main flex items-center justify-center w-full h-screen'>
        <Icon type='loading' size={36} color="#999" />
      </main>
      <Toaster position='bottom-center' containerClassName="react_toaster" />
      {!loading && domains.length === 0 && <AddDomain closeModal={() => console.log('Cannot Close Modal!')} />}
    </div>
  );
};

// export const getServerSideProps = async (context:NextPageContext) => {
//    const { req, res } = context;
//    const authorized = verifyUser(req as NextApiRequest, res as NextApiResponse);
//    // console.log('####### authorized: ', authorized);

//    if (authorized !== 'authorized') {
//      return { redirect: { destination: '/login', permanent: false } };
//    }

//    let domains: Domain[] = [];
//    try {
//       const fetchOpts = { method: 'GET', headers: { Authorization: `Bearer ${process.env.APIKEY}` } };
//       const domainsRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/domains`, fetchOpts).then((result) => result.json());
//       // console.log(domainsRes);

//       domains = domainsRes.domains;
//       if (domains.length > 0) {
//          const firstDomainItem = domains[0].slug;
//          return { redirect: { destination: `/domain/${firstDomainItem}`, permanent: false } };
//       }
//    } catch (error) {
//       console.log(error);
//    }

//    // console.log('domains: ', domains);
//    return { props: { authorized, domains } };
// };

export default Home;
