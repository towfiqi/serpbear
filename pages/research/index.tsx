import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import Icon from '../../components/common/Icon';
import TopBar from '../../components/common/TopBar';
import KeywordIdeasTable from '../../components/ideas/KeywordIdeasTable';
import { exportKeywordIdeas } from '../../utils/client/exportcsv';
import { useFetchKeywordIdeas, useMutateKeywordIdeas } from '../../services/adwords';
import { useFetchSettings } from '../../services/settings';
import Settings from '../../components/settings/Settings';
import SelectField from '../../components/common/SelectField';
import allCountries, { adwordsLanguages } from '../../utils/countries';
import Footer from '../../components/common/Footer';

const Research: NextPage = () => {
   const router = useRouter();
   const [showSettings, setShowSettings] = useState(false);
   const [showFavorites, setShowFavorites] = useState(false);
   const [language, setLanguage] = useState('1000');
   const [country, setCountry] = useState('US');
   const [seedKeywords, setSeedKeywords] = useState('');

   const { data: appSettings } = useFetchSettings();
   const adwordsConnected = !!(appSettings && appSettings?.settings?.adwords_refresh_token
      && appSettings?.settings?.adwords_developer_token, appSettings?.settings?.adwords_account_id);
   const { data: keywordIdeasData, isLoading: isLoadingIdeas, isError: errorLoadingIdeas } = useFetchKeywordIdeas(router, adwordsConnected);
   const { mutate: updateKeywordIdeas, isLoading: isUpdatingIdeas } = useMutateKeywordIdeas(router);

   const keywordIdeas:IdeaKeyword[] = keywordIdeasData?.data?.keywords || [];
   const favorites:IdeaKeyword[] = keywordIdeasData?.data?.favorites || [];
   const keywordIdeasSettings = keywordIdeasData?.data?.settings || undefined;
   const { country: previousCountry, language: previousLang, keywords: previousSeedKeywords } = keywordIdeasSettings || {};

   useEffect(() => {
      if (previousCountry) { setCountry(previousCountry); }
      if (previousLang) { setLanguage(previousLang.toString()); }
      if (previousSeedKeywords) { setSeedKeywords(previousSeedKeywords.join(',')); }
   }, [previousCountry, previousLang, previousSeedKeywords]);

   const reloadKeywordIdeas = () => {
      const keywordPaylod = seedKeywords ? seedKeywords.split(',').map((key) => key.trim()) : undefined;
      updateKeywordIdeas({ seedType: 'custom', language, domain: 'research', keywords: keywordPaylod, country });
   };

   const countryOptions = useMemo(() => {
      return Object.keys(allCountries)
      .filter((countryISO) => allCountries[countryISO][3] !== 0)
      .map((countryISO) => ({ label: allCountries[countryISO][0], value: countryISO }));
   }, []);

   const languageOPtions = useMemo(() => Object.entries(adwordsLanguages).map(([value, label]) => ({ label, value })), []);

   const buttonStyle = 'leading-6 inline-block px-2 py-2 text-gray-500 hover:text-gray-700';
   const buttonLabelStyle = 'ml-2 text-sm not-italic lg:invisible lg:opacity-0';
   const labelStyle = 'mb-2 font-semibold inline-block text-sm text-gray-700 capitalize w-full';

   return (
      <div className={'Login'}>
         <Head>
            <title>Research Keywords - SerpBear</title>
         </Head>
         <TopBar showSettings={() => setShowSettings(true)} showAddModal={() => null } />
         <div className=" w-full max-w-7xl mx-auto lg:flex lg:flex-row">
            <div className="sidebar w-full p-6 lg:pt-44 lg:w-1/5 lg:block lg:pr-0" data-testid="sidebar">
               <h3 className="hidden py-7 text-base font-bold text-blue-700 lg:block">
                  <span className=' relative top-[3px] mr-1'><Icon type="logo" size={24} color="#364AFF" /></span> SerpBear
               </h3>
               <div className={`sidebar_menu domKeywords max-h-96 overflow-auto styled-scrollbar p-4
                bg-white border border-gray-200 rounded lg:rounded-none lg:rounded-s lg:border-r-0`}>
                  <div className={'mb-3'}>
                     <label className={labelStyle}>Generate Ideas from given Keywords (Max 20)</label>
                     <textarea
                     className='w-full border border-solid border-gray-300 focus:border-blue-100 p-3 rounded outline-none text-sm'
                     value={seedKeywords}
                     onChange={(event) => setSeedKeywords(event.target.value)}
                     placeholder="keyword1, keyword2.."
                     />
                  </div>
                  <div className={'mb-3'}>
                     <label className={labelStyle}>Country</label>
                     <SelectField
                        selected={[country]}
                        options={countryOptions}
                        defaultLabel='All Countries'
                        updateField={(updated:string[]) => setCountry(updated[0])}
                        flags={true}
                        multiple={false}
                        fullWidth={true}
                        maxHeight={48}
                        rounded='rounded'
                     />
                  </div>
                  <div className={'mb-3'}>
                     <label className={labelStyle}>Language</label>
                     <SelectField
                        selected={[language]}
                        options={languageOPtions}
                        defaultLabel='All Languages'
                        updateField={(updated:string[]) => setLanguage(updated[0])}
                        rounded='rounded'
                        multiple={false}
                        fullWidth={true}
                        maxHeight={48}
                     />
                  </div>
                  <button
                  className={`w-full py-2 px-5 mt-2 rounded bg-blue-700 text-white 
                  font-semibold ${!adwordsConnected ? ' cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                  title={!adwordsConnected ? 'Please Connect Google Ads account to generate Keyword Ideas..' : ''}
                  onClick={() => !isUpdatingIdeas && adwordsConnected && reloadKeywordIdeas()}>
                        <Icon type={isUpdatingIdeas ? 'loading' : 'download'} size={14} /> {isUpdatingIdeas ? 'Loading....' : 'Load Ideas'}
                  </button>
               </div>
            </div>
            <div className="domain_kewywords px-5 lg:px-0 lg:pt-8 w-full">
               <div className='domain_kewywords_head w-full '>
                  <div className=' flex mt-12 mb-0 justify-between'>
                     <h1 className=" font-bold mb-0 mt-0 pt-2 lg:text-xl lg:mb-6" data-testid="domain-header">Research Keywords</h1>
                     <button
                     className={`domheader_action_button relative mb-3 
                     ${buttonStyle} ${keywordIdeas.length === 0 ? 'cursor-not-allowed opacity-60' : ''}`}
                     aria-pressed="false"
                     onClick={() => exportKeywordIdeas(showFavorites ? favorites : keywordIdeas, 'research')}>
                        <Icon type='download' size={20} /><i className={`${buttonLabelStyle}`}>Export as csv</i>
                     </button>
                  </div>
               </div>
               <KeywordIdeasTable
               isLoading={isLoadingIdeas}
               noIdeasDatabase={errorLoadingIdeas}
               domain={null}
               keywords={keywordIdeas}
               favorites={favorites}
               isAdwordsIntegrated={adwordsConnected}
               showFavorites={showFavorites}
               setShowFavorites={setShowFavorites}
               />
            </div>
         </div>
         <CSSTransition in={showSettings} timeout={300} classNames="settings_anim" unmountOnExit mountOnEnter>
             <Settings closeSettings={() => setShowSettings(false)} />
         </CSSTransition>
         <Footer currentVersion={appSettings?.settings?.version ? appSettings.settings.version : ''} />
      </div>
   );
};

export default Research;
