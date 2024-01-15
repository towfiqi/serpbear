import React, { useEffect, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import toast, { Toaster } from 'react-hot-toast';
import TopBar from '../../components/common/TopBar';
import AddDomain from '../../components/domains/AddDomain';
import Settings from '../../components/settings/Settings';
import { useFetchSettings } from '../../services/settings';
import { fetchDomainScreenshot, useFetchDomains } from '../../services/domains';
import DomainItem from '../../components/domains/DomainItem';
import Icon from '../../components/common/Icon';

type thumbImages = { [domain:string] : string }

const Domains: NextPage = () => {
   const router = useRouter();
   const [noScrapprtError, setNoScrapprtError] = useState(false);
   const [showSettings, setShowSettings] = useState(false);
   const [showAddDomain, setShowAddDomain] = useState(false);
   const [domainThumbs, setDomainThumbs] = useState<thumbImages>({});
   const { data: appSettings } = useFetchSettings();
   const { data: domainsData, isLoading } = useFetchDomains(router, true);

   const totalKeywords = useMemo(() => {
      let keywords = 0;
      if (domainsData?.domains) {
         domainsData.domains.forEach(async (domain:DomainType) => {
            keywords += domain?.keywordCount || 0;
         });
      }
      return keywords;
   }, [domainsData]);

   useEffect(() => {
      if (domainsData?.domains && domainsData.domains.length > 0 && appSettings?.settings?.screenshot_key) {
         domainsData.domains.forEach(async (domain:DomainType) => {
            if (domain.domain) {
               const domainThumb = await fetchDomainScreenshot(domain.domain, appSettings.settings.screenshot_key);
               if (domainThumb) {
                  setDomainThumbs((currentThumbs) => ({ ...currentThumbs, [domain.domain]: domainThumb }));
               }
            }
         });
      }
   }, [domainsData, appSettings]);

   useEffect(() => {
      // console.log('appSettings.settings: ', appSettings && appSettings.settings);
      if (appSettings && appSettings.settings && (!appSettings.settings.scraper_type || (appSettings.settings.scraper_type === 'none'))) {
         setNoScrapprtError(true);
      }
   }, [appSettings]);

   const manuallyUpdateThumb = async (domain: string) => {
      if (domain && appSettings?.settings?.screenshot_key) {
         const domainThumb = await fetchDomainScreenshot(domain, appSettings.settings.screenshot_key, true);
         if (domainThumb) {
            toast(`${domain} Screenshot Updated Successfully!`, { icon: '✔️' });
            setDomainThumbs((currentThumbs) => ({ ...currentThumbs, [domain]: domainThumb }));
         } else {
            toast(`Failed to Fetch ${domain} Screenshot!`, { icon: '⚠️' });
         }
      }
   };

   return (
      <div data-testid="domains" className="Domain flex flex-col min-h-screen">
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
               <div className=' text-sm text-gray-600'>
                  {domainsData?.domains?.length || 0} Domains <span className=' text-gray-300 ml-1 mr-1'>|</span> {totalKeywords} keywords
               </div>
               <div>
                  <button
                  data-testid="addDomainButton"
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
                           updateThumb={manuallyUpdateThumb}
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
            <AddDomain closeModal={() => setShowAddDomain(false)} domains={domainsData?.domains || []} />
         </CSSTransition>
         <CSSTransition in={showSettings} timeout={300} classNames="settings_anim" unmountOnExit mountOnEnter>
             <Settings closeSettings={() => setShowSettings(false)} />
         </CSSTransition>
         <footer className='text-center flex flex-1 justify-center pb-5 items-end'>
            <span className='text-gray-500 text-xs'><a href='https://github.com/towfiqi/serpbear' target="_blank" rel='noreferrer'>SerpBear v{appSettings?.settings?.version || '0.0.0'}</a></span>
         </footer>
         <Toaster position='bottom-center' containerClassName="react_toaster" />
      </div>
   );
};

export default Domains;
