import { useRouter, NextRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from 'react-query';

type UpdatePayload = {
   domainSettings: DomainSettings,
   domain: DomainType
}

export async function fetchDomains(router: NextRouter, withStats:boolean) {
   const res = await fetch(`${window.location.origin}/api/domains${withStats ? '?withstats=true' : ''}`, { method: 'GET' });
   if (res.status >= 400 && res.status < 600) {
      if (res.status === 401) {
         console.log('Unauthorized!!');
         router.push('/login');
      }
      throw new Error('Bad response from server');
   }
   return res.json();
}

export function useFetchDomains(router: NextRouter, withStats:boolean = false) {
   return useQuery('domains', () => fetchDomains(router, withStats));
}

export function useAddDomain(onSuccess:Function) {
   const router = useRouter();
   const queryClient = useQueryClient();
   return useMutation(async (domainName:string) => {
      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const fetchOpts = { method: 'POST', headers, body: JSON.stringify({ domain: domainName }) };
      const res = await fetch(`${window.location.origin}/api/domains`, fetchOpts);
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      return res.json();
   }, {
      onSuccess: async (data) => {
         console.log('Domain Added!!!', data);
         const newDomain:DomainType = data.domain;
         toast(`${newDomain.domain} Added Successfully!`, { icon: '✔️' });
         onSuccess(false);
         if (newDomain && newDomain.slug) {
            router.push(`/domain/${data.domain.slug}`);
         }
         queryClient.invalidateQueries(['domains']);
      },
      onError: () => {
         console.log('Error Adding New Domain!!!');
         toast('Error Adding New Domain');
      },
   });
}

export function useUpdateDomain(onSuccess:Function) {
   const queryClient = useQueryClient();
   return useMutation(async ({ domainSettings, domain }: UpdatePayload) => {
      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const fetchOpts = { method: 'PUT', headers, body: JSON.stringify(domainSettings) };
      const res = await fetch(`${window.location.origin}/api/domains?domain=${domain.domain}`, fetchOpts);
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      return res.json();
   }, {
      onSuccess: async () => {
         console.log('Settings Updated!!!');
         toast('Settings Updated!', { icon: '✔️' });
         onSuccess();
         queryClient.invalidateQueries(['domains']);
      },
      onError: () => {
         console.log('Error Updating Domain Settings!!!');
         toast('Error Updating Domain Settings', { icon: '⚠️' });
      },
   });
}

export function useDeleteDomain(onSuccess:Function) {
   const queryClient = useQueryClient();
   return useMutation(async (domain:DomainType) => {
      const res = await fetch(`${window.location.origin}/api/domains?domain=${domain.domain}`, { method: 'DELETE' });
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      return res.json();
   }, {
      onSuccess: async () => {
         toast('Domain Removed Successfully!', { icon: '✔️' });
         onSuccess();
         queryClient.invalidateQueries(['domains']);
      },
      onError: () => {
         console.log('Error Removing Domain!!!');
         toast('Error Removing Domain', { icon: '⚠️' });
      },
   });
}
