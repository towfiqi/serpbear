import React from 'react';
import { useClearFailedQueue } from '../../services/settings';
import Icon from '../common/Icon';
import SelectField, { SelectionOption } from '../common/SelectField';
import SecretField from '../common/SecretField';
import ToggleField from '../common/ToggleField';

type ScraperSettingsProps = {
   settings: SettingsType,
   settingsError: null | {
      type: string,
      msg: string
   },
   updateSettings: Function,
}

const ScraperSettings = ({ settings, settingsError, updateSettings }:ScraperSettingsProps) => {
   const { mutate: clearFailedMutate, isLoading: clearingQueue } = useClearFailedQueue(() => {});

   const scrapingOptions: SelectionOption[] = [
      { label: 'Daily', value: 'daily' },
      { label: 'Every Other Day', value: 'other_day' },
      { label: 'Weekly', value: 'weekly' },
      { label: 'Monthly', value: 'monthly' },
      { label: 'Never', value: 'never' },
   ];
   const delayOptions: SelectionOption[] = [
      { label: 'No Delay', value: '0' },
      { label: '5 Seconds', value: '5000' },
      { label: '10 Seconds', value: '10000' },
      { label: '30 Seconds', value: '30000' },
      { label: '1 Minutes', value: '60000' },
      { label: '2 Minutes', value: '120000' },
      { label: '5 Minutes', value: '300000' },
      { label: '10 Minutes', value: '600000' },
      { label: '15 Minutes', value: '900000' },
      { label: '30 Minutes', value: '1800000' },
   ];
   const allScrapers: SelectionOption[] = settings.available_scapers ? settings.available_scapers : [];
   const scraperOptions: SelectionOption[] = [{ label: 'None', value: 'none' }, ...allScrapers];
   const labelStyle = 'mb-2 font-semibold inline-block text-sm text-gray-700 capitalize';

   return (
      <div>
      <div className='settings__content styled-scrollbar p-6 text-sm'>

         <div className="settings__section__select mb-5">
            <SelectField
            label='Scraping Method'
            options={scraperOptions}
            selected={[settings.scraper_type || 'none']}
            defaultLabel="Select Scraper"
            updateField={(updatedTime:[string]) => updateSettings('scraper_type', updatedTime[0])}
            multiple={false}
            rounded={'rounded'}
            minWidth={220}
            />
         </div>
         {settings.scraper_type !== 'none' && settings.scraper_type !== 'proxy' && (
            <div className="settings__section__secret mb-5">
               <SecretField
               label='Scraper API Key or Token'
               placeholder={'API Key/Token'}
               value={settings?.scaping_api || ''}
               hasError={settingsError?.type === 'no_api_key'}
               onChange={(value:string) => updateSettings('scaping_api', value)}
               />
            </div>
         )}
         {settings.scraper_type === 'proxy' && (
            <div className="settings__section__input mb-5">
               <label className={labelStyle}>Proxy List</label>
               <textarea
                  className={`w-full p-2 border border-gray-200 rounded mb-3 text-xs 
                  focus:outline-none min-h-[160px] focus:border-blue-200 
                  ${settingsError?.type === 'no_email' ? ' border-red-400 focus:border-red-400' : ''} `}
                  value={settings?.proxy}
                  placeholder={'http://122.123.22.45:5049\nhttps://user:password@122.123.22.45:5049'}
                  onChange={(event) => updateSettings('proxy', event.target.value)}
               />
            </div>
         )}
         {settings.scraper_type !== 'none' && (
            <div className="settings__section__input mb-5">
               <SelectField
                  label='Scraping Frequency'
                  multiple={false}
                  selected={[settings?.scrape_interval || 'daily']}
                  options={scrapingOptions}
                  defaultLabel={'Notification Settings'}
                  updateField={(updated:string[]) => updated[0] && updateSettings('scrape_interval', updated[0])}
                  rounded='rounded'
                  maxHeight={48}
                  minWidth={220}
               />
               <small className=' text-gray-500 pt-2 block'>This option requires Server/Docker Instance Restart to take Effect.</small>
            </div>
         )}
            <div className="settings__section__input mb-5">
               <SelectField
                  label='keyword Scrape Delay'
                  multiple={false}
                  selected={[settings?.scrape_delay || '0']}
                  options={delayOptions}
                  defaultLabel={'Delay Settings'}
                  updateField={(updated:string[]) => updated[0] && updateSettings('scrape_delay', updated[0])}
                  rounded='rounded'
                  maxHeight={48}
                  minWidth={220}
               />
               <small className=' text-gray-500 pt-2 block'>This option requires Server/Docker Instance Restart to take Effect.</small>
            </div>
            <div className="settings__section__input mb-5">
               <ToggleField
               label='Auto Retry Failed Keyword Scrape'
               value={!!settings?.scrape_retry }
               onChange={(val) => updateSettings('scrape_retry', val)}
               />
            </div>
            {settings?.scrape_retry && (settings.failed_queue?.length || 0) > 0 && (
               <div className="settings__section__input mb-5">
                  <label className={labelStyle}>Clear Failed Retry Queue</label>
                  <button
                  onClick={() => clearFailedMutate()}
                  className=' py-3 px-5 w-full rounded cursor-pointer bg-gray-100 text-gray-800
                  font-semibold text-sm hover:bg-gray-200'>
                     {clearingQueue && <Icon type="loading" size={14} />} Clear Failed Queue
                       ({settings.failed_queue?.length || 0} Keywords)
                  </button>
               </div>
            )}
      </div>
   </div>
   );
};

export default ScraperSettings;
