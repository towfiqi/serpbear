import { NextRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from 'react-query';

export function useTestAdwordsIntegration(onSuccess?: Function) {
   return useMutation(async (payload:{developer_token:string, account_id:string}) => {
      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const fetchOpts = { method: 'POST', headers, body: JSON.stringify({ ...payload }) };
      const res = await fetch(`${window.location.origin}/api/adwords`, fetchOpts);
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      return res.json();
   }, {
      onSuccess: async (data) => {
         console.log('Ideas Added:', data);
         toast('Google Adwords has been integrated successfully!', { icon: '✔️' });
         if (onSuccess) {
            onSuccess(false);
         }
      },
      onError: (error) => {
         console.log('Error Loading Keyword Ideas!!!', error);
         toast('Failed to connect to Google Adwords. Please make sure you have provided the correct API info.', { icon: '⚠️' });
      },
   });
}

export async function fetchAdwordsKeywordIdeas(router: NextRouter) {
   // if (!router.query.slug) { throw new Error('Invalid Domain Name'); }
   const res = await fetch(`${window.location.origin}/api/ideas?domain=${router.query.slug}`, { method: 'GET' });
   if (res.status >= 400 && res.status < 600) {
      if (res.status === 401) {
         console.log('Unauthorized!!');
         router.push('/login');
      }
      throw new Error('Bad response from server');
   }
   return res.json();
}

export function useFetchKeywordIdeas(router: NextRouter, adwordsConnected = false) {
   return useQuery(
            `keywordIdeas-${router.query.slug}`,
            () => router.query.slug && fetchAdwordsKeywordIdeas(router),
               { enabled: adwordsConnected, retry: false },
            );
}

export function useMutateKeywordIdeas(router:NextRouter, onSuccess?: Function) {
   const queryClient = useQueryClient();
   return useMutation(async (data:Record<string, any>) => {
      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const fetchOpts = { method: 'POST', headers, body: JSON.stringify({ ...data }) };
      const res = await fetch(`${window.location.origin}/api/ideas`, fetchOpts);
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      return res.json();
   }, {
      onSuccess: async (data) => {
         console.log('Ideas Added:', data);
         toast('Keyword Ideas Loaded Successfully!', { icon: '✔️' });
         if (onSuccess) {
            onSuccess(false);
         }
         queryClient.invalidateQueries([`keywordIdeas-${router.query.slug}`]);
      },
      onError: (error) => {
         console.log('Error Loading Keyword Ideas!!!', error);
         toast('Error Loading Keyword Ideas', { icon: '⚠️' });
      },
   });
}

export function useMutateFavKeywordIdeas(router:NextRouter, onSuccess?: Function) {
   const queryClient = useQueryClient();
   return useMutation(async (payload:Record<string, any>) => {
      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const fetchOpts = { method: 'PUT', headers, body: JSON.stringify({ ...payload }) };
      const res = await fetch(`${window.location.origin}/api/ideas`, fetchOpts);
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      return res.json();
   }, {
      onSuccess: async (data) => {
         console.log('Ideas Added:', data);
         // toast('Keyword Updated!', { icon: '✔️' });
         if (onSuccess) {
            onSuccess(false);
         }
         queryClient.invalidateQueries([`keywordIdeas-${router.query.slug}`]);
      },
      onError: (error) => {
         console.log('Error Favorating Keywords', error);
         toast('Error Favorating Keywords', { icon: '⚠️' });
      },
   });
}
