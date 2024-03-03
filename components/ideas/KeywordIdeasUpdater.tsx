import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useMutateKeywordIdeas } from '../../services/adwords';
import allCountries, { adwordsLanguages } from '../../utils/countries';
import SelectField from '../common/SelectField';
import Icon from '../common/Icon';

interface KeywordIdeasUpdaterProps {
   onUpdate?: Function,
   domain?: DomainType,
   searchConsoleConnected: boolean,
   adwordsConnected: boolean,
   settings?: {
      seedSCKeywords: boolean,
      seedCurrentKeywords: boolean,
      seedDomain: boolean,
      language: string,
      countries: string[],
      keywords: string,
      seedType: string
   }
}

const KeywordIdeasUpdater = ({ onUpdate, settings, domain, searchConsoleConnected = false, adwordsConnected = false }: KeywordIdeasUpdaterProps) => {
   const router = useRouter();
   const [seedType, setSeedType] = useState(() => settings?.seedType || 'auto');
   const [language, setLanguage] = useState(() => settings?.language.toString() || '1000');
   const [countries, setCoutries] = useState<string[]>(() => settings?.countries || ['US']);
   const [keywords, setKeywords] = useState(() => (settings?.keywords && Array.isArray(settings?.keywords) ? settings?.keywords.join(',') : ''));
   const { mutate: updateKeywordIdeas, isLoading: isUpdatingIdeas } = useMutateKeywordIdeas(router, () => onUpdate && onUpdate());

   const seedTypeOptions = useMemo(() => {
      const options = [
        { label: 'Automatically from Website Content', value: 'auto' },
        { label: 'Based on currently tracked keywords', value: 'tracking' },
        { label: 'From Custom Keywords', value: 'custom' },
      ];

      if (searchConsoleConnected) {
        options.splice(-2, 0, { label: 'Based on already ranking keywords (GSC)', value: 'searchconsole' });
      }

      return options;
    }, [searchConsoleConnected]);

   const reloadKeywordIdeas = () => {
      const keywordPaylod = seedType !== 'auto' && keywords ? keywords.split(',').map((key) => key.trim()) : undefined;
      console.log('keywordPaylod :', keywords, keywordPaylod);
      updateKeywordIdeas({
         seedType,
         language,
         domain: domain?.domain,
         domainSlug: domain?.slug,
         keywords: keywordPaylod,
         country: countries[0],
      });
   };

   const countryOptions = useMemo(() => {
      return Object.keys(allCountries)
      .filter((countryISO) => allCountries[countryISO][3] !== 0)
      .map((countryISO) => ({ label: allCountries[countryISO][0], value: countryISO }));
   }, []);

   const languageOPtions = useMemo(() => Object.entries(adwordsLanguages).map(([value, label]) => ({ label, value })), []);

   const labelStyle = 'mb-2 font-semibold inline-block text-sm text-gray-700 capitalize w-full';
   return (
      <div>

            <div>
               <div className={'mb-3'}>
                  <label className={labelStyle}>Get Keyword Ideas</label>
                  <SelectField
                     selected={[seedType]}
                     options={seedTypeOptions}
                     defaultLabel='Get Ideas Based On'
                     updateField={(updated:string[]) => setSeedType(updated[0])}
                     fullWidth={true}
                     multiple={false}
                     rounded='rounded'
                  />
               </div>
               {seedType === 'custom' && (
                  <>
                     <div className={'mb-3'}>
                        <label className={labelStyle}>Get Ideas from given Keywords (Max 20)</label>
                        <textarea
                        className='w-full border border-solid border-gray-300 focus:border-blue-100 p-3 rounded outline-none'
                        value={keywords}
                        onChange={(event) => setKeywords(event.target.value)}
                        placeholder="keyword1, keyword2.."
                        />
                     </div>
                     <hr className=' my-4' />
                  </>
               )}

               <div className={'mb-3'}>
                  <label className={labelStyle}>Country</label>
                  <SelectField
                     selected={countries}
                     options={countryOptions}
                     defaultLabel='All Countries'
                     updateField={(updated:string[]) => setCoutries(updated)}
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
                  title={!adwordsConnected ? 'Please Connect Ads account to generate Keyword Ideas..' : ''}
                  onClick={() => !isUpdatingIdeas && adwordsConnected && reloadKeywordIdeas()}>
                     <Icon type={isUpdatingIdeas ? 'loading' : 'reload'} size={12} /> {isUpdatingIdeas ? 'Loading....' : 'Load Keyword Ideas'}
               </button>
            </div>
      </div>
   );
};

export default KeywordIdeasUpdater;
