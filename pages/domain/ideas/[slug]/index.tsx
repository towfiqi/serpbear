import React, { useMemo, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import Sidebar from '../../../../components/common/Sidebar';
import TopBar from '../../../../components/common/TopBar';
import DomainHeader from '../../../../components/domains/DomainHeader';
import AddDomain from '../../../../components/domains/AddDomain';
import DomainSettings from '../../../../components/domains/DomainSettings';
import { exportKeywordIdeas } from '../../../../utils/client/exportcsv';
import Settings from '../../../../components/settings/Settings';
import { useFetchDomains } from '../../../../services/domains';
import { useFetchSettings } from '../../../../services/settings';
import KeywordIdeasTable from '../../../../components/ideas/KeywordIdeasTable';
import { useFetchKeywordIdeas } from '../../../../services/adwords';
import KeywordIdeasUpdater from '../../../../components/ideas/KeywordIdeasUpdater';
import Modal from '../../../../components/common/Modal';
import Footer from '../../../../components/common/Footer';

const DiscoverPage: NextPage = () => {
   const router = useRouter();
   const [showDomainSettings, setShowDomainSettings] = useState(false);
   const [showSettings, setShowSettings] = useState(false);
   const [showAddDomain, setShowAddDomain] = useState(false);
   const [showUpdateModal, setShowUpdateModal] = useState(false);
   const [showFavorites, setShowFavorites] = useState(false);

   const { data: appSettings } = useFetchSettings();
   const { data: domainsData } = useFetchDomains(router);
   const adwordsConnected = !!(appSettings && appSettings?.settings?.adwords_refresh_token
      && appSettings?.settings?.adwords_developer_token, appSettings?.settings?.adwords_account_id);
   const searchConsoleConnected = !!(appSettings && appSettings?.settings?.search_console_integrated);
   const { data: keywordIdeasData, isLoading: isLoadingIdeas, isError: errorLoadingIdeas } = useFetchKeywordIdeas(router, adwordsConnected);
   const theDomains: DomainType[] = (domainsData && domainsData.domains) || [];
   const keywordIdeas:IdeaKeyword[] = keywordIdeasData?.data?.keywords || [];
   const favorites:IdeaKeyword[] = keywordIdeasData?.data?.favorites || [];
   const keywordIdeasSettings = keywordIdeasData?.data?.settings || undefined;

   const activDomain: DomainType|null = useMemo(() => {
      let active:DomainType|null = null;
      if (domainsData?.domains && router.query?.slug) {
         active = domainsData.domains.find((x:DomainType) => x.slug === router.query.slug) || null;
      }
      return active;
   }, [router.query.slug, domainsData]);

   return (
      <div className="Domain ">
         {activDomain && activDomain.domain
         && <Head>
               <title>{`${activDomain.domain} - Keyword Ideas` } </title>
            </Head>
         }
         <TopBar showSettings={() => setShowSettings(true)} showAddModal={() => setShowAddDomain(true)} />
         <div className="flex w-full max-w-7xl mx-auto">
            <Sidebar domains={theDomains} showAddModal={() => setShowAddDomain(true)} />
            <div className="domain_kewywords px-5 pt-10 lg:px-0 lg:pt-8 w-full">
               {activDomain && activDomain.domain ? (
                  <DomainHeader
                  domain={activDomain}
                  domains={theDomains}
                  showAddModal={() => console.log('XXXXX')}
                  showSettingsModal={setShowDomainSettings}
                  exportCsv={() => exportKeywordIdeas(showFavorites ? favorites : keywordIdeas, activDomain.domain)}
                  showIdeaUpdateModal={() => setShowUpdateModal(true)}
                  />
               ) : <div className='w-full lg:h-[100px]'></div>}
               <KeywordIdeasTable
               isLoading={isLoadingIdeas}
               noIdeasDatabase={errorLoadingIdeas}
               domain={activDomain}
               keywords={keywordIdeas}
               favorites={favorites}
               isAdwordsIntegrated={adwordsConnected}
               showFavorites={showFavorites}
               setShowFavorites={setShowFavorites}
               />
            </div>
         </div>

         <CSSTransition in={showAddDomain} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <AddDomain closeModal={() => setShowAddDomain(false)} domains={domainsData?.domains || []} />
         </CSSTransition>

         <CSSTransition in={showDomainSettings} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <DomainSettings
            domain={showDomainSettings && theDomains && activDomain && activDomain.domain ? activDomain : false}
            closeModal={setShowDomainSettings}
            />
         </CSSTransition>

         <CSSTransition in={showSettings} timeout={300} classNames="settings_anim" unmountOnExit mountOnEnter>
             <Settings closeSettings={() => setShowSettings(false)} />
         </CSSTransition>

         {showUpdateModal && activDomain?.domain && (
            <Modal closeModal={() => setShowUpdateModal(false) } title={'Load Keyword Ideas from Google Ads'} verticalCenter={true}>
               <KeywordIdeasUpdater
               domain={activDomain}
               onUpdate={() => setShowUpdateModal(false)}
               settings={keywordIdeasSettings}
               searchConsoleConnected={searchConsoleConnected}
               adwordsConnected={adwordsConnected}
               />
            </Modal>
         )}
         <Footer currentVersion={appSettings?.settings?.version ? appSettings.settings.version : ''} />
      </div>
   );
};

export default DiscoverPage;
