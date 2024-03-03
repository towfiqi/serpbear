import React, { useState } from 'react';
import SearchConsoleSettings from './SearchConsoleSettings';
import AdWordsSettings from './AdWordsSettings';
import Icon from '../common/Icon';

type IntegrationSettingsProps = {
   settings: SettingsType,
   settingsError: null | {
      type: string,
      msg: string
   },
   updateSettings: Function,
   performUpdate: Function,
   closeSettings: Function
}
const IntegrationSettings = ({ settings, settingsError, updateSettings, performUpdate, closeSettings }:IntegrationSettingsProps) => {
   const [currentTab, setCurrentTab] = useState<string>('searchconsole');
   const tabStyle = 'inline-block px-4 py-1 rounded-full mr-3 cursor-pointer text-sm';
   return (
      <div className='settings__content styled-scrollbar p-6 text-sm'>
         <div className='mb-4 '>
            <ul>
               <li
               className={`${tabStyle} ${currentTab === 'searchconsole' ? ' bg-blue-50 text-blue-600' : ''}`}
               onClick={() => setCurrentTab('searchconsole')}>
                  <Icon type='google' size={14} /> Search Console
               </li>
               <li
               className={`${tabStyle} ${currentTab === 'adwords' ? ' bg-blue-50 text-blue-600' : ''}`}
               onClick={() => setCurrentTab('adwords')}>
                  <Icon type='adwords' size={14} /> Google Ads
               </li>
            </ul>
         </div>
         <div>
            {currentTab === 'searchconsole' && settings && (
               <SearchConsoleSettings settings={settings} updateSettings={updateSettings} settingsError={settingsError} />
            )}
            {currentTab === 'adwords' && settings && (
               <AdWordsSettings
               settings={settings}
               updateSettings={updateSettings}
               settingsError={settingsError}
               performUpdate={performUpdate}
               closeSettings={closeSettings}
               />
            )}
         </div>
      </div>
   );
};

export default IntegrationSettings;
