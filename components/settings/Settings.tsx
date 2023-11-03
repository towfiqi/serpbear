import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
// import { useQuery } from 'react-query';
import useUpdateSettings, { useClearFailedQueue, useFetchSettings } from '../../services/settings';
import Icon from '../common/Icon';
import SelectField, { SelectionOption } from '../common/SelectField';

type SettingsProps = {
   closeSettings: Function,
   settings?: SettingsType
}

type SettingsError = {
   type: string,
   msg: string
}

const defaultSettings = {
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
};

const Settings = ({ closeSettings }:SettingsProps) => {
   const [currentTab, setCurrentTab] = useState<string>('scraper');
   const [settings, setSettings] = useState<SettingsType>(defaultSettings);
   const [settingsError, setSettingsError] = useState<SettingsError|null>(null);
   const { mutate: updateMutate, isLoading: isUpdating } = useUpdateSettings(() => console.log(''));
   const { data: appSettings, isLoading } = useFetchSettings();
   const { mutate: clearFailedMutate, isLoading: clearingQueue } = useClearFailedQueue(() => {});

   useEffect(() => {
      if (appSettings && appSettings.settings) {
         setSettings(appSettings.settings);
      }
   }, [appSettings]);

   useEffect(() => {
      const closeModalonEsc = (event:KeyboardEvent) => {
         if (event.key === 'Escape') {
            console.log(event.key);
            closeSettings();
         }
      };
      window.addEventListener('keydown', closeModalonEsc, false);
      return () => {
         window.removeEventListener('keydown', closeModalonEsc, false);
      };
   }, [closeSettings]);

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
      }
   };

   const labelStyle = 'mb-2 font-semibold inline-block text-sm text-gray-700 capitalize';

   const notificationOptions: SelectionOption[] = [
      { label: 'Daily', value: 'daily' },
      { label: 'Weekly', value: 'weekly' },
      { label: 'Monthly', value: 'monthly' },
      { label: 'Never', value: 'never' },
   ];
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

   const tabStyle = 'inline-block px-4 py-1 rounded-full mr-3 cursor-pointer text-sm';
   return (
       <div className="settings fixed w-full h-screen top-0 left-0 z-50" onClick={closeOnBGClick}>
            <div className="absolute w-full max-w-xs bg-white customShadow top-0 right-0 h-screen" data-loading={isLoading} >
               {isLoading && <div className='absolute flex content-center items-center h-full'><Icon type="loading" size={24} /></div>}
               <div className='settings__header p-6 border-b border-b-slate-200 text-slate-500'>
                  <h3 className=' text-black text-lg font-bold'>Settings</h3>
                  <button
                  className=' absolute top-2 right-2 p-2 px-3 text-gray-400 hover:text-gray-700 transition-all hover:rotate-90'
                  onClick={() => closeSettings()}>
                     <Icon type='close' size={24} />
                  </button>
               </div>
               <div className=' px-4 mt-4 '>
                  <ul>
                     <li
                     className={`${tabStyle} ${currentTab === 'scraper' ? ' bg-blue-50 text-blue-600' : ''}`}
                     onClick={() => setCurrentTab('scraper')}>
                        Scraper
                     </li>
                     <li
                     className={`${tabStyle} ${currentTab === 'notification' ? ' bg-blue-50 text-blue-600' : ''}`}
                     onClick={() => setCurrentTab('notification')}>
                        Notification
                     </li>
                  </ul>
               </div>
               {currentTab === 'scraper' && (
                  <div>
                     <div className='settings__content styled-scrollbar p-6 text-sm'>

                        <div className="settings__section__select mb-5">
                           <label className={labelStyle}>Scraping Method</label>
                           <SelectField
                           options={scraperOptions}
                           selected={[settings.scraper_type || 'none']}
                           defaultLabel="Select Scraper"
                           updateField={(updatedTime:[string]) => updateSettings('scraper_type', updatedTime[0])}
                           multiple={false}
                           rounded={'rounded'}
                           minWidth={270}
                           />
                        </div>
                        {['scrapingant', 'scrapingrobot', 'serply', 'serpapi', 'spaceSerp'].includes(settings.scraper_type) && (
                           <div className="settings__section__input mr-3">
                              <label className={labelStyle}>Scraper API Key or Token</label>
                              <input
                                 className={`w-full p-2 border border-gray-200 rounded mt-2 mb-3 focus:outline-none  focus:border-blue-200 
                                 ${settingsError && settingsError.type === 'no_api_key' ? ' border-red-400 focus:border-red-400' : ''} `}
                                 type="text"
                                 value={settings?.scaping_api || ''}
                                 placeholder={'API Key/Token'}
                                 onChange={(event) => updateSettings('scaping_api', event.target.value)}
                              />
                           </div>
                        )}
                        {settings.scraper_type === 'proxy' && (
                           <div className="settings__section__input mb-5">
                              <label className={labelStyle}>Proxy List</label>
                              <textarea
                                 className={`w-full p-2 border border-gray-200 rounded mb-3 text-xs 
                                 focus:outline-none min-h-[160px] focus:border-blue-200 
                                 ${settingsError && settingsError.type === 'no_email' ? ' border-red-400 focus:border-red-400' : ''} `}
                                 value={settings?.proxy}
                                 placeholder={'http://122.123.22.45:5049\nhttps://user:password@122.123.22.45:5049'}
                                 onChange={(event) => updateSettings('proxy', event.target.value)}
                              />
                           </div>
                        )}
                        {settings.scraper_type !== 'none' && (
                           <div className="settings__section__input mb-5">
                              <label className={labelStyle}>Scraping Frequency</label>
                              <SelectField
                                 multiple={false}
                                 selected={[settings?.scrape_interval || 'daily']}
                                 options={scrapingOptions}
                                 defaultLabel={'Notification Settings'}
                                 updateField={(updated:string[]) => updated[0] && updateSettings('scrape_interval', updated[0])}
                                 rounded='rounded'
                                 maxHeight={48}
                                 minWidth={270}
                              />
                              <small className=' text-gray-500 pt-2 block'>This option requires Server/Docker Instance Restart to take Effect.</small>
                           </div>
                        )}
                           <div className="settings__section__input mb-5">
                              <label className={labelStyle}>Delay Between Each keyword Scrape</label>
                              <SelectField
                                 multiple={false}
                                 selected={[settings?.scrape_delay || '0']}
                                 options={delayOptions}
                                 defaultLabel={'Delay Settings'}
                                 updateField={(updated:string[]) => updated[0] && updateSettings('scrape_delay', updated[0])}
                                 rounded='rounded'
                                 maxHeight={48}
                                 minWidth={270}
                              />
                              <small className=' text-gray-500 pt-2 block'>This option requires Server/Docker Instance Restart to take Effect.</small>
                           </div>
                           <div className="settings__section__input mb-5">
                              <label className="relative inline-flex items-center cursor-pointer">
                                 <span className="text-sm font-medium text-gray-900 dark:text-gray-300 w-56">Auto Retry Failed Keyword Scrape</span>
                                 <input
                                 type="checkbox"
                                 value={settings?.scrape_retry ? 'true' : '' }
                                 checked={settings.scrape_retry || false}
                                 className="sr-only peer"
                                 onChange={() => updateSettings('scrape_retry', !settings.scrape_retry)}
                                 />
                                 <div className="relative rounded-3xl w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4
                                 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800rounded-full peer dark:bg-gray-700
                                 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-['']
                                 after:absolute after:top-[2px] after:left-[2px] after:bg-white  after:border-gray-300
                                 after:border after:rounded-full after:h-5 after:w-5
                                 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>

                              </label>
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
               )}

            {currentTab === 'notification' && (
               <div>
                  <div className='settings__content styled-scrollbar p-6 text-sm'>
                     <div className="settings__section__input mb-5">
                        <label className={labelStyle}>Notification Frequency</label>
                        <SelectField
                           multiple={false}
                           selected={[settings.notification_interval]}
                           options={notificationOptions}
                           defaultLabel={'Notification Settings'}
                           updateField={(updated:string[]) => updated[0] && updateSettings('notification_interval', updated[0])}
                           rounded='rounded'
                           maxHeight={48}
                           minWidth={270}
                        />
                     </div>
                     {settings.notification_interval !== 'never' && (
                        <>
                           <div className="settings__section__input mb-5">
                              <label className={labelStyle}>Notification Emails</label>
                              <input
                                 className={`w-full p-2 border border-gray-200 rounded mb-3 focus:outline-none  focus:border-blue-200 
                                 ${settingsError && settingsError.type === 'no_email' ? ' border-red-400 focus:border-red-400' : ''} `}
                                 type="text"
                                 value={settings?.notification_email}
                                 placeholder={'test@gmail.com'}
                                 onChange={(event) => updateSettings('notification_email', event.target.value)}
                              />
                           </div>
                           <div className="settings__section__input mb-5">
                              <label className={labelStyle}>SMTP Server</label>
                              <input
                                 className={`w-full p-2 border border-gray-200 rounded mb-3 focus:outline-none  focus:border-blue-200 
                                 ${settingsError && settingsError.type === 'no_smtp_server' ? ' border-red-400 focus:border-red-400' : ''} `}
                                 type="text"
                                 value={settings?.smtp_server || ''}
                                 onChange={(event) => updateSettings('smtp_server', event.target.value)}
                              />
                           </div>
                           <div className="settings__section__input mb-5">
                              <label className={labelStyle}>SMTP Port</label>
                              <input
                                 className={`w-full p-2 border border-gray-200 rounded mb-3 focus:outline-none  focus:border-blue-200 
                                 ${settingsError && settingsError.type === 'no_smtp_port' ? ' border-red-400 focus:border-red-400' : ''} `}
                                 type="text"
                                 value={settings?.smtp_port || ''}
                                 onChange={(event) => updateSettings('smtp_port', event.target.value)}
                              />
                           </div>
                           <div className="settings__section__input mb-5">
                              <label className={labelStyle}>SMTP Username</label>
                              <input
                                 className={'w-full p-2 border border-gray-200 rounded mb-3 focus:outline-none  focus:border-blue-200'}
                                 type="text"
                                 value={settings?.smtp_username || ''}
                                 onChange={(event) => updateSettings('smtp_username', event.target.value)}
                              />
                           </div>
                           <div className="settings__section__input mb-5">
                              <label className={labelStyle}>SMTP Password</label>
                              <input
                                 className={'w-full p-2 border border-gray-200 rounded mb-3 focus:outline-none  focus:border-blue-200'}
                                 type="text"
                                 value={settings?.smtp_password || ''}
                                 onChange={(event) => updateSettings('smtp_password', event.target.value)}
                              />
                           </div>
                           <div className="settings__section__input mb-5">
                              <label className={labelStyle}>From Email Address</label>
                              <input
                                 className={`w-full p-2 border border-gray-200 rounded mb-3 focus:outline-none  focus:border-blue-200 
                                 ${settingsError && settingsError.type === 'no_smtp_from' ? ' border-red-400 focus:border-red-400' : ''} `}
                                 type="text"
                                 value={settings?.notification_email_from || ''}
                                 placeholder="no-reply@mydomain.com"
                                 onChange={(event) => updateSettings('notification_email_from', event.target.value)}
                              />
                           </div>
                        </>
                     )}

                     </div>
                     {settingsError && (
                        <div className='absolute w-full bottom-16  text-center p-3 bg-red-100 text-red-600 text-sm font-semibold'>
                           {settingsError.msg}
                        </div>
                     )}
               </div>
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
