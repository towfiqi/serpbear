import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import TopBar from '../../components/common/TopBar';
import AddDomain from '../../components/domains/AddDomain';
import Settings from '../../components/settings/Settings';
import { useFetchSettings } from '../../services/settings';
import { useFetchDomains } from '../../services/domains';
import DomainItem from '../../components/domains/DomainItem';
import Icon from '../../components/common/Icon';

type thumbImages = { [domain:string] : string }

const SingleDomain: NextPage = () => {
   const router = useRouter();
   const [noScrapprtError, setNoScrapprtError] = useState(false);
   const [showSettings, setShowSettings] = useState(false);
   const [showAddDomain, setShowAddDomain] = useState(false);
   const [domainThumbs, setDomainThumbs] = useState<thumbImages>({});
   const { data: appSettings } = useFetchSettings();
   const { data: domainsData, isLoading } = useFetchDomains(router, true);

   useEffect(() => {
      // console.log('Domains Data: ', domainsData);
      if (domainsData?.domains && domainsData.domains.length > 0) {
         const domainThumbsRaw = localStorage.getItem('domainThumbs');
         const domThumbs = domainThumbsRaw ? JSON.parse(domainThumbsRaw) : {};
         domainsData.domains.forEach(async (domain:DomainType) => {
            if (domain.domain) {
               if (!domThumbs[domain.domain]) {
                  const domainImageBlob = await fetch(`https://image.thum.io/get/auth/66909-serpbear/maxAge/96/width/200/https://${domain.domain}`).then((res) => res.blob());
                  if (domainImageBlob) {
                     const reader = new FileReader();
                     await new Promise((resolve, reject) => {
                       reader.onload = resolve;
                       reader.onerror = reject;
                       reader.readAsDataURL(domainImageBlob);
                     });
                     const imageBase: string = reader.result && typeof reader.result === 'string' ? reader.result : '';
                     localStorage.setItem('domainThumbs', JSON.stringify({ ...domThumbs, [domain.domain]: imageBase }));
                     setDomainThumbs((currentThumbs) => ({ ...currentThumbs, [domain.domain]: imageBase }));
                  }
               } else {
                  setDomainThumbs((currentThumbs) => ({ ...currentThumbs, [domain.domain]: domThumbs[domain.domain] }));
               }
            }
         });
      }
   }, [domainsData]);

   useEffect(() => {
      // console.log('appSettings.settings: ', appSettings && appSettings.settings);
      if (appSettings && appSettings.settings && (!appSettings.settings.scraper_type || (appSettings.settings.scraper_type === 'none'))) {
         setNoScrapprtError(true);
      }
   }, [appSettings]);

   return (
      <div className="Domain ">
         {noScrapprtError && (
               <div className=' p-3 bg-red-600 text-white text-sm text-center'>
                  A Scrapper/Proxy has not been set up Yet. Open Settings to set it up and start using the app.
               </div>
         )}
         <Head>
            <title>Domains - SerpBear</title>
         </Head>
         <TopBar showSettings={() => setShowSettings(true)} showAddModal={() => setShowAddDomain(true)} />

         <div className="flex flex-col w-full max-w-5xl mx-auto p-6 lg:mt-24 lg:p-0">
            <div className='flex justify-between mb-2 items-center'>
               <div className=' text-sm'>{domainsData?.domains?.length || 0} Domains</div>
               <div>
                  <button
                  className={'ml-2 inline-block py-2 text-blue-700 font-bold text-sm'}
                  onClick={() => setShowAddDomain(true)}>
                     <span
                     className='text-center leading-4 mr-2 inline-block rounded-full w-7 h-7 pt-1 bg-blue-700 text-white font-bold text-lg'>+</span>
                     <i className=' not-italic hidden lg:inline-block'>Add Domain</i>
                  </button>
               </div>
            </div>
            <div className='flex w-full flex-col mb-8'>
               {domainsData?.domains && domainsData.domains.map((domain:DomainType) => {
                  return <DomainItem
                           key={domain.ID}
                           domain={domain}
                           selected={false}
                           isConsoleIntegrated={!!(appSettings && appSettings?.settings?.search_console_integrated) }
                           thumb={domainThumbs[domain.domain]}
                           // isConsoleIntegrated={false}
                           />;
               })}
               {isLoading && (
                  <div className='noDomains mt-4 p-5 py-12 rounded border text-center bg-white text-sm'>
                     <Icon type="loading" /> Loading Domains...
                  </div>
               )}
               {!isLoading && domainsData && domainsData.domains && domainsData.domains.length === 0 && (
                  <div className='noDomains mt-4 p-5 py-12 rounded border text-center bg-white text-sm'>
                     No Domains Found. Add a Domain to get started!
                  </div>
               )}
            </div>
         </div>

         <CSSTransition in={showAddDomain} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <AddDomain closeModal={() => setShowAddDomain(false)} />
         </CSSTransition>
         <CSSTransition in={showSettings} timeout={300} classNames="settings_anim" unmountOnExit mountOnEnter>
             <Settings closeSettings={() => setShowSettings(false)} />
         </CSSTransition>
      </div>
   );
};

export default SingleDomain;
