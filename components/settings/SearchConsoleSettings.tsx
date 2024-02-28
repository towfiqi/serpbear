import React from 'react';
import InputField from '../common/InputField';

type SearchConsoleSettingsProps = {
   settings: SettingsType,
   settingsError: null | {
      type: string,
      msg: string
   },
   updateSettings: Function,
}

const SearchConsoleSettings = ({ settings, settingsError, updateSettings }:SearchConsoleSettingsProps) => {
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
      </div>
   </div>
   );
};

export default SearchConsoleSettings;
