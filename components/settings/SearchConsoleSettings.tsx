import React, { useState } from 'react';
import InputField from '../common/InputField';
import Icon from '../common/Icon';
import { refreshSearchConsoleData } from '../../services/searchConsole';

type SearchConsoleSettingsProps = {
   settings: SettingsType,
   settingsError: null | {
      type: string,
      msg: string
   },
   updateSettings: Function,
}

const SearchConsoleSettings = ({ settings, settingsError, updateSettings }:SearchConsoleSettingsProps) => {
   const [refreshing, setRefreshing] = useState(false);

   const handleRefresh = async () => {
      setRefreshing(true);
      try {
         await refreshSearchConsoleData();
      } finally {
         setRefreshing(false);
      }
   };

   return (
      <div>
      <div>

         {/* <div className="settings__section__input mb-5">
            <ToggleField
            label='Enable Goolge Search Console'
            value={settings?.scrape_retry ? 'true' : '' }
            onChange={(val) => updateSettings('scrape_retry', val)}
            />
         </div> */}
         <div className="settings__section__input mb-4 flex justify-between items-center w-full">
            <InputField
            label='Search Console Client Email'
            onChange={(client_email:string) => updateSettings('search_console_client_email', client_email)}
            value={settings.search_console_client_email}
            placeholder='myapp@appspot.gserviceaccount.com'
            />
         </div>
         <div className="settings__section__input mb-4 flex flex-col justify-between items-center w-full">
            <label className='mb-2 font-semibold block text-sm text-gray-700 capitalize w-full'>Search Console Private Key</label>
            <textarea
               className={`w-full p-2 border border-gray-200 rounded mb-3 text-xs
               focus:outline-none h-[100px] focus:border-blue-200`}
               value={settings.search_console_private_key}
               placeholder={'-----BEGIN PRIVATE KEY-----/ssssaswdkihad....'}
               onChange={(event) => updateSettings('search_console_private_key', event.target.value)}
            />
         </div>
         <div className="settings__section__input mb-5">
            <button
               onClick={handleRefresh}
               disabled={refreshing}
               className={`py-3 px-5 w-full rounded cursor-pointer bg-gray-100 text-gray-800 font-semibold text-sm hover:bg-gray-200
               disabled:opacity-50 disabled:cursor-not-allowed`}
            >
               {refreshing && <Icon type="loading" size={14} />} Refresh Search Console Data
            </button>
         </div>
      </div>
   </div>
   );
};

export default SearchConsoleSettings;
