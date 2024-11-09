import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useFetchSettings, useUpdateSettings } from '../../services/settings';
import Icon from '../common/Icon';
import NotificationSettings from './NotificationSettings';
import ScraperSettings from './ScraperSettings';
import useOnKey from '../../hooks/useOnKey';
import IntegrationSettings from './IntegrationSettings';

type SettingsProps = {
   closeSettings: Function,
   settings?: SettingsType
}

type SettingsError = {
   type: string,
   msg: string
}

export const defaultSettings: SettingsType = {
   scraper_type: 'none',
   scrape_delay: 'none',
   scrape_retry: false,
   notification_interval: 'daily',
   notification_email: '',
   smtp_server: '',
   smtp_port: '',
   smtp_username: '',
   smtp_password: '',
   notification_email_from: '',
   notification_email_from_name: 'SerpBear',
   search_console: true,
   search_console_client_email: '',
   search_console_private_key: '',
   keywordsColumns: ['Best', 'History', 'Volume', 'Search Console'],
};

const Settings = ({ closeSettings }:SettingsProps) => {
   const [currentTab, setCurrentTab] = useState<string>('scraper');
   const [settings, setSettings] = useState<SettingsType>(defaultSettings);
   const [settingsError, setSettingsError] = useState<SettingsError|null>(null);
   const { mutate: updateMutate, isLoading: isUpdating } = useUpdateSettings(() => console.log(''));
   const { data: appSettings, isLoading } = useFetchSettings();
   useOnKey('Escape', closeSettings);

   useEffect(() => {
      if (appSettings && appSettings.settings) {
         setSettings(appSettings.settings);
      }
   }, [appSettings]);

   const closeOnBGClick = (e:React.SyntheticEvent) => {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      if (e.target === e.currentTarget) { closeSettings(); }
   };

   const updateSettings = (key: string, value:string|number|boolean) => {
      setSettings({ ...settings, [key]: value });
   };

   const performUpdate = () => {
      let error: null|SettingsError = null;
      const { notification_interval, notification_email, notification_email_from, scraper_type, smtp_port, smtp_server, scaping_api } = settings;
      if (notification_interval !== 'never') {
         if (!settings.notification_email) {
            error = { type: 'no_email', msg: 'Insert a Valid Email address' };
         }
         if (notification_email && (!smtp_port || !smtp_server || !notification_email_from)) {
               let type = 'no_smtp_from';
               if (!smtp_port) { type = 'no_smtp_port'; }
               if (!smtp_server) { type = 'no_smtp_server'; }
               error = { type, msg: 'Insert SMTP Server details that will be used to send the emails.' };
         }
      }

      if (scraper_type !== 'proxy' && scraper_type !== 'none' && !scaping_api) {
         error = { type: 'no_api_key', msg: 'Insert a Valid API Key or Token for the Scraper Service.' };
      }

      if (error) {
         setSettingsError(error);
         setTimeout(() => { setSettingsError(null); }, 3000);
      } else {
         // Perform Update
         updateMutate(settings);
         // If Scraper is updated, refresh the page.
         if (appSettings.settings === 'none' && scraper_type !== 'none') {
            window.location.reload();
         }
      }
   };

   const tabStyle = `inline-block px-3 py-2 rounded-md  cursor-pointer text-xs lg:text-sm lg:mr-3 lg:px-4 select-none z-10
   text-gray-600 border border-b-0 relative top-[1px] rounded-b-none`;
   const tabStyleActive = 'bg-white text-blue-600 border-slate-200';

   return (
       <div className="settings fixed w-full h-screen top-0 left-0 z-50" onClick={closeOnBGClick}>
            <div className="absolute w-full max-w-md bg-white customShadow top-0 right-0 h-screen" data-loading={isLoading} >
               {isLoading && <div className='absolute flex content-center items-center h-full'><Icon type="loading" size={24} /></div>}
               <div className='settings__header px-5 py-4 text-slate-500'>
                  <h3 className=' text-black text-lg font-bold'>Settings</h3>
                  <button
                  className=' absolute top-2 right-2 p-2 px- text-gray-400 hover:text-gray-700 transition-all hover:rotate-90'
                  onClick={() => closeSettings()}>
                     <Icon type='close' size={24} />
                  </button>
               </div>
               <div className='border border-slate-200 px-3 py-4 pb-0 border-l-0 border-r-0 bg-[#f8f9ff]'>
                  <ul>
                     <li
                     className={`${tabStyle} ${currentTab === 'scraper' ? tabStyleActive : 'border-transparent '}`}
                     onClick={() => setCurrentTab('scraper')}>
                       <Icon type='scraper' /> Scraper
                     </li>
                     <li
                     className={`${tabStyle} ${currentTab === 'notification' ? tabStyleActive : 'border-transparent'}`}
                     onClick={() => setCurrentTab('notification')}>
                        <Icon type='email' /> Notification
                     </li>
                     <li
                     className={`${tabStyle} ${currentTab === 'integrations' ? tabStyleActive : 'border-transparent'}`}
                     onClick={() => setCurrentTab('integrations')}>
                       <Icon type='integration' size={14} /> Integrations
                     </li>
                  </ul>
               </div>
               {currentTab === 'scraper' && settings && (
                  <ScraperSettings settings={settings} updateSettings={updateSettings} settingsError={settingsError} />
               )}

               {currentTab === 'notification' && settings && (
                  <NotificationSettings settings={settings} updateSettings={updateSettings} settingsError={settingsError} />
               )}
               {currentTab === 'integrations' && settings && (
                  <IntegrationSettings
                  settings={settings}
                  updateSettings={updateSettings}
                  settingsError={settingsError}
                  performUpdate={performUpdate}
                  closeSettings={closeSettings}
                   />
               )}
               <div className=' border-t-[1px] border-gray-200 p-2 px-3'>
                  <button
                  onClick={() => performUpdate()}
                  className=' py-3 px-5 w-full rounded cursor-pointer bg-blue-700 text-white font-semibold text-sm'>
                  {isUpdating && <Icon type="loading" size={14} />} Update Settings
                  </button>
               </div>
            </div>
            <Toaster position='bottom-center' containerClassName="react_toaster" />
       </div>
   );
};

export default Settings;
