import React from 'react';
import SelectField from '../common/SelectField';
import SecretField from '../common/SecretField';

type NotificationSettingsProps = {
   settings: SettingsType,
   settingsError: null | {
      type: string,
      msg: string
   },
   updateSettings: Function,
}

const NotificationSettings = ({ settings, settingsError, updateSettings }:NotificationSettingsProps) => {
   const labelStyle = 'mb-2 font-semibold inline-block text-sm text-gray-700 capitalize';

   return (
      <div>
         <div className='settings__content styled-scrollbar p-6 text-sm'>
            <div className="settings__section__input mb-5">
               <label className={labelStyle}>Notification Frequency</label>
               <SelectField
                  multiple={false}
                  selected={[settings.notification_interval]}
                  options={[
                     { label: 'Daily', value: 'daily' },
                     { label: 'Weekly', value: 'weekly' },
                     { label: 'Monthly', value: 'monthly' },
                     { label: 'Never', value: 'never' },
                  ]}
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
                        ${settingsError?.type === 'no_email' ? ' border-red-400 focus:border-red-400' : ''} `}
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
                        ${settingsError?.type === 'no_smtp_server' ? ' border-red-400 focus:border-red-400' : ''} `}
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

                  <SecretField
                  label='SMTP Password'
                  value={settings?.smtp_password || ''}
                  onChange={(value:string) => updateSettings('smtp_password', value)}
                  />

                  <div className="settings__section__input mb-5">
                     <label className={labelStyle}>From Email Address</label>
                     <input
                        className={`w-full p-2 border border-gray-200 rounded mb-3 focus:outline-none  focus:border-blue-200 
                        ${settingsError?.type === 'no_smtp_from' ? ' border-red-400 focus:border-red-400' : ''} `}
                        type="text"
                        value={settings?.notification_email_from || ''}
                        placeholder="no-reply@mydomain.com"
                        onChange={(event) => updateSettings('notification_email_from', event.target.value)}
                     />
                  </div>
               </>
            )}

            </div>
            {settingsError?.msg && (
               <div className='absolute w-full bottom-16  text-center p-3 bg-red-100 text-red-600 text-sm font-semibold'>
                  {settingsError.msg}
               </div>
            )}
      </div>
   );
};

export default NotificationSettings;
