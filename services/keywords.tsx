import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { NextRouter } from 'next/router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const fetchKeywords = async (router: NextRouter, domain: string) => {
   if (!domain) { return []; }
   const res = await fetch(`${window.location.origin}/api/keywords?domain=${domain}`, { method: 'GET' });
   return res.json();
};

export function useFetchKeywords(
   router: NextRouter,
   domain: string,
   setKeywordSPollInterval?:Function,
   keywordSPollInterval:undefined|number = undefined,
) {
   const { data: keywordsData, isLoading: keywordsLoading, isError, dataUpdatedAt } = useQuery({
      queryKey: ['keywords', domain],
      queryFn: () => fetchKeywords(router, domain),
      refetchInterval: keywordSPollInterval,
   });
   // Stands in for the per-query onSuccess that v5 removed: runs once per successful fetch,
   // never when the poll interval alone changes (that would stop the polling early).
   useEffect(() => {
      const data = keywordsData;
      // If Keywords are Manually Refreshed check if the any of the keywords position are still being fetched
      // If yes, then refecth the keywords every 5 seconds until all the keywords position is updated by the server
      if (data && data.keywords && data.keywords.length > 0 && setKeywordSPollInterval) {
         const hasRefreshingKeyword = data.keywords.some((x:KeywordType) => x.updating);
         if (hasRefreshingKeyword) {
            setKeywordSPollInterval(5000);
         } else {
            if (keywordSPollInterval) {
               toast('Keywords Refreshed!', { icon: '✔️' });
            }
            setKeywordSPollInterval(undefined);
         }
      }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [dataUpdatedAt]);
   return { keywordsData, keywordsLoading, isError };
}

export function useAddKeywords(onSuccess:Function) {
   const queryClient = useQueryClient();
   return useMutation({ mutationFn: async (keywords:KeywordAddPayload[]) => {
      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const fetchOpts = { method: 'POST', headers, body: JSON.stringify({ keywords }) };
      const res = await fetch(`${window.location.origin}/api/keywords`, fetchOpts);
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      return res.json();
   },
      onSuccess: async () => {
         console.log('Keywords Added!!!');
         toast('Keywords Added Successfully!', { icon: '✔️' });
         onSuccess();
         queryClient.invalidateQueries({ queryKey: ['keywords'] });
      },
      onError: () => {
         console.log('Error Adding New Keywords!!!');
         toast('Error Adding New Keywords', { icon: '⚠️' });
      },
   });
}

export function useDeleteKeywords(onSuccess:Function) {
   const queryClient = useQueryClient();
   return useMutation({ mutationFn: async (keywordIDs:number[]) => {
      const keywordIds = keywordIDs.join(',');
      const res = await fetch(`${window.location.origin}/api/keywords?id=${keywordIds}`, { method: 'DELETE' });
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      return res.json();
   },
      onSuccess: async () => {
         console.log('Removed Keyword!!!');
         onSuccess();
         toast('Keywords Removed Successfully!', { icon: '✔️' });
         queryClient.invalidateQueries({ queryKey: ['keywords'] });
      },
      onError: () => {
         console.log('Error Removing Keyword!!!');
         toast('Error Removing the Keywords', { icon: '⚠️' });
      },
   });
}

export function useFavKeywords(onSuccess:Function) {
   const queryClient = useQueryClient();
   return useMutation({ mutationFn: async ({ keywordID, sticky }:{keywordID:number, sticky:boolean}) => {
      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const fetchOpts = { method: 'PUT', headers, body: JSON.stringify({ sticky }) };
      const res = await fetch(`${window.location.origin}/api/keywords?id=${keywordID}`, fetchOpts);
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      return res.json();
   },
      onSuccess: async (data) => {
         onSuccess();
         const isSticky = data.keywords[0] && data.keywords[0].sticky;
         toast(isSticky ? 'Keywords Made Favorite!' : 'Keywords Unfavorited!', { icon: '✔️' });
         queryClient.invalidateQueries({ queryKey: ['keywords'] });
      },
      onError: () => {
         console.log('Error Changing Favorite Status!!!');
         toast('Error Changing Favorite Status.', { icon: '⚠️' });
      },
   });
}

export function useUpdateKeywordTags(onSuccess:Function) {
   const queryClient = useQueryClient();
   return useMutation({ mutationFn: async ({ tags }:{tags:{ [ID:number]: string[] }}) => {
      const keywordIds = Object.keys(tags).join(',');
      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const fetchOpts = { method: 'PUT', headers, body: JSON.stringify({ tags }) };
      const res = await fetch(`${window.location.origin}/api/keywords?id=${keywordIds}`, fetchOpts);
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      return res.json();
   },
      onSuccess: async () => {
         onSuccess();
         toast('Keyword Tags Updated!', { icon: '✔️' });
         queryClient.invalidateQueries({ queryKey: ['keywords'] });
      },
      onError: () => {
         console.log('Error Updating Keyword Tags!!!');
         toast('Error Updating Keyword Tags.', { icon: '⚠️' });
      },
   });
}

export function useRefreshKeywords(onSuccess:Function) {
   const queryClient = useQueryClient();
   return useMutation({ mutationFn: async ({ ids = [], domain = '' } : {ids?: number[], domain?: string}) => {
      const keywordIds = ids.join(',');
      console.log(keywordIds);
      const query = ids.length === 0 && domain ? `?id=all&domain=${domain}` : `?id=${keywordIds}`;
      const res = await fetch(`${window.location.origin}/api/refresh${query}`, { method: 'POST' });
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      return res.json();
   },
      onSuccess: async () => {
         console.log('Keywords Added to Refresh Queue!!!');
         onSuccess();
         toast('Keywords Added to Refresh Queue', { icon: '🔄' });
         queryClient.invalidateQueries({ queryKey: ['keywords'] });
      },
      onError: () => {
         console.log('Error Refreshing Keywords!!!');
         toast('Error Refreshing Keywords.', { icon: '⚠️' });
      },
   });
}

export function useFetchSingleKeyword(keywordID:number) {
   const query = useQuery({
      queryKey: ['keyword', keywordID],
      queryFn: async () => {
      try {
         const fetchURL = `${window.location.origin}/api/keyword?id=${keywordID}`;
         const res = await fetch(fetchURL, { method: 'GET' }).then((result) => result.json());
         if (res.status >= 400 && res.status < 600) {
            throw new Error('Bad response from server');
         }
         return { history: res.keyword.history || [], searchResult: res.keyword.lastResult || [] };
      } catch (error) {
         throw new Error('Error Loading Keyword Details');
      }
   } });
   const { isError, errorUpdatedAt } = query;
   // Stands in for the per-query onError that v5 removed.
   useEffect(() => {
      if (!isError) { return; }
      console.log('Error Loading Keyword Data!!!');
      toast('Error Loading Keyword Details.', { icon: '⚠️' });
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [errorUpdatedAt]);
   return query;
}

export async function fetchSearchResults(router:NextRouter, keywordData: Record<string, string>) {
   const { keyword, country, device } = keywordData;
   const res = await fetch(`${window.location.origin}/api/refresh?keyword=${keyword}&country=${country}&device=${device}`, { method: 'GET' });
   if (res.status >= 400 && res.status < 600) {
      if (res.status === 401) {
         console.log('Unauthorized!!');
         router.push('/login');
      }
      throw new Error('Bad response from server');
   }
   return res.json();
}
