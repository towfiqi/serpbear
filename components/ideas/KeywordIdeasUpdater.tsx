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
   const [countries, setCountries] = useState<string[]>(() => settings?.countries || ['US']);
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
      let keywordPayload: string[] | undefined;

      if (seedType === 'custom' && keywords) {
         // For custom seed type, parse the comma-separated keywords
         keywordPayload = keywords.split(',').map((key) => key.trim()).filter((key) => key.length > 0);
      } else if (seedType === 'tracking' || seedType === 'searchconsole') {
         // For tracking and searchconsole, send empty array - backend will populate from DB/SC
         keywordPayload = [];
      } else {
         // For auto seed type, don't send keywords (undefined) - domainUrl will be used
         keywordPayload = undefined;
      }

      console.log('keywordPayload :', keywords, keywordPayload);
      updateKeywordIdeas({
         seedType,
         language,
         domainUrl: domain?.domain,
         domainSlug: domain?.slug,
         keywords: keywordPayload,
         country: countries[0],
      });
   };

   const countryOptions = useMemo(() => {
      return Object.keys(allCountries)
      .filter((countryISO) => allCountries[countryISO][3] !== 0)
      .map((countryISO) => ({ label: allCountries[countryISO][0], value: countryISO }));
   }, []);

   const languageOptions = useMemo(() => Object.entries(adwordsLanguages).map(([value, label]) => ({ label, value })), []);

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
                     updateField={(updated:string[]) => setCountries(updated)}
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
                     options={languageOptions}
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
