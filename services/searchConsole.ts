import { NextRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useQuery } from 'react-query';

export async function fetchSCKeywords(router: NextRouter) {
   // if (!router.query.slug) { throw new Error('Invalid Domain Name'); }
   const res = await fetch(`${window.location.origin}/api/searchconsole?domain=${router.query.slug}`, { method: 'GET' });
   if (res.status >= 400 && res.status < 600) {
      if (res.status === 401) {
         console.log('Unauthorized!!');
         router.push('/login');
      }
      throw new Error('Bad response from server');
   }
   return res.json();
}

export function useFetchSCKeywords(router: NextRouter, domainLoaded: boolean = false) {
   // console.log('ROUTER: ', router);
   return useQuery('sckeywords', () => router.query.slug && fetchSCKeywords(router), { enabled: domainLoaded });
}

export async function fetchSCInsight(router: NextRouter) {
   // if (!router.query.slug) { throw new Error('Invalid Domain Name'); }
   const res = await fetch(`${window.location.origin}/api/insight?domain=${router.query.slug}`, { method: 'GET' });
   if (res.status >= 400 && res.status < 600) {
      if (res.status === 401) {
         console.log('Unauthorized!!');
         router.push('/login');
      }
      throw new Error('Bad response from server');
   }
   return res.json();
}

export function useFetchSCInsight(router: NextRouter, domainLoaded: boolean = false) {
   // console.log('ROUTER: ', router);
   return useQuery('scinsight', () => router.query.slug && fetchSCInsight(router), { enabled: domainLoaded });
}

export const refreshSearchConsoleData = async () => {
   try {
      const res = await fetch(`${window.location.origin}/api/searchconsole`, { method: 'POST' });
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      toast('Search Console Data Refreshed!', { icon: '✔️' });
      return res.json();
   } catch (error) {
      console.log('Error Refreshing Search Console Data!!!', error);
      toast('Error Refreshing Search Console Data', { icon: '⚠️' });
      throw error;
   }
};
