import { useRouter } from 'next/router';
import { useState } from 'react';
import Icon from '../common/Icon';
import Modal from '../common/Modal';
import { useDeleteDomain, useFetchDomain, useUpdateDomain } from '../../services/domains';
import InputField from '../common/InputField';
import SelectField from '../common/SelectField';

type DomainSettingsProps = {
   domain:DomainType|false,
   closeModal: Function
}

type DomainSettingsError = {
   type: string,
   msg: string,
}

const DomainSettings = ({ domain, closeModal }: DomainSettingsProps) => {
   const router = useRouter();
   const [currentTab, setCurrentTab] = useState<'notification'|'searchconsole'>('notification');
   const [showRemoveDomain, setShowRemoveDomain] = useState<boolean>(false);
   const [settingsError, setSettingsError] = useState<DomainSettingsError>({ type: '', msg: '' });
   const [domainSettings, setDomainSettings] = useState<DomainSettings>(() => ({
      notification_interval: domain && domain.notification_interval ? domain.notification_interval : 'never',
      notification_emails: domain && domain.notification_emails ? domain.notification_emails : '',
      search_console: domain && domain.search_console ? JSON.parse(domain.search_console) : {
         property_type: 'domain', url: '', client_email: '', private_key: '',
      },
   }));

   const { mutate: updateMutate, error: domainUpdateError, isLoading: isUpdating } = useUpdateDomain(() => closeModal(false));
   const { mutate: deleteMutate } = useDeleteDomain(() => { closeModal(false); router.push('/domains'); });

   // Get the Full Domain Data along with the Search Console API Data.
   useFetchDomain(router, domain && domain.domain ? domain.domain : '', (domainObj:DomainType) => {
      const currentSearchConsoleSettings = domainObj.search_console && JSON.parse(domainObj.search_console);
      setDomainSettings({ ...domainSettings, search_console: currentSearchConsoleSettings || domainSettings.search_console });
   });

   const updateDomain = () => {
      let error: DomainSettingsError | null = null;
      if (domainSettings.notification_emails) {
         const notification_emails = domainSettings.notification_emails.split(',');
         const invalidEmails = notification_emails.find((x) => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,15})+$/.test(x) === false);
         console.log('invalidEmails: ', invalidEmails);
         if (invalidEmails) {
            error = { type: 'email', msg: 'Invalid Email' };
         }
      }
      if (error && error.type) {
         console.log('Error!!!!!');
         setSettingsError(error);
         setTimeout(() => {
            setSettingsError({ type: '', msg: '' });
         }, 3000);
      } else if (domain) {
            updateMutate({ domainSettings, domain });
         }
   };

   const tabStyle = `inline-block px-4 py-2 rounded-md mr-3 cursor-pointer text-sm select-none z-10
                     text-gray-600 border border-b-0 relative top-[1px] rounded-b-none`;
   return (
      <div>
         <Modal closeModal={() => closeModal(false)} title={'Domain Settings'} width="[500px]" verticalCenter={currentTab === 'searchconsole'} >
            <div data-testid="domain_settings" className=" text-sm">
               <div className=' mt-3 mb-5 border  border-slate-200 px-2 py-4 pb-0
               relative left-[-20px] w-[calc(100%+40px)] border-l-0 border-r-0 bg-[#f8f9ff]'>
                  <ul>
                     <li
                     className={`${tabStyle} ${currentTab === 'notification' ? ' bg-white text-blue-600 border-slate-200' : 'border-transparent'} `}
                     onClick={() => setCurrentTab('notification')}>
                       <Icon type='email' /> Notification
                     </li>
                     <li
                     className={`${tabStyle} ${currentTab === 'searchconsole' ? ' bg-white text-blue-600 border-slate-200' : 'border-transparent'}`}
                     onClick={() => setCurrentTab('searchconsole')}>
                        <Icon type='google' /> Search Console
                     </li>
                  </ul>
               </div>

               <div>
                  {currentTab === 'notification' && (
                     <div className="mb-4 flex justify-between items-center w-full">
                        <InputField
                        label='Notification Emails'
                        onChange={(emails:string) => setDomainSettings({ ...domainSettings, notification_emails: emails })}
                        value={domainSettings.notification_emails || ''}
                        placeholder='Your Emails'
                        />
                     </div>
                  )}
                  {currentTab === 'searchconsole' && (
                     <>
                        <div className="mb-4 flex justify-between items-center w-full">
                           <label className='mb-2 font-semibold inline-block text-sm text-gray-700 capitalize'>Property Type</label>
                           <SelectField
                           options={[{ label: 'Domain', value: 'domain' }, { label: 'URL', value: 'url' }]}
                           selected={[domainSettings.search_console?.property_type || 'domain']}
                           defaultLabel="Select Search Console Property Type"
                           updateField={(updated:['domain'|'url']) => setDomainSettings({
                              ...domainSettings,
                              search_console: { ...(domainSettings.search_console as DomainSearchConsole), property_type: updated[0] || 'domain' },
                           })}
                           multiple={false}
                           rounded={'rounded'}
                           />
                        </div>
                        {domainSettings?.search_console?.property_type === 'url' && (
                           <div className="mb-4 flex justify-between items-center w-full">
                              <InputField
                              label='Property URL (Required)'
                              onChange={(url:string) => setDomainSettings({
                                 ...domainSettings,
                                 search_console: { ...(domainSettings.search_console as DomainSearchConsole), url },
                              })}
                              value={domainSettings?.search_console?.url || ''}
                              placeholder='Search Console Property URL. eg: https://mywebsite.com/'
                              />
                           </div>
                        )}
                        <div className="mb-4 flex justify-between items-center w-full">
                           <InputField
                           label='Search Console Client Email'
                           onChange={(client_email:string) => setDomainSettings({
                              ...domainSettings,
                              search_console: { ...(domainSettings.search_console as DomainSearchConsole), client_email },
                           })}
                           value={domainSettings?.search_console?.client_email || ''}
                           placeholder='myapp@appspot.gserviceaccount.com'
                           />
                        </div>
                        <div className="mb-4 flex flex-col justify-between items-center w-full">
                           <label className='mb-2 font-semibold block text-sm text-gray-700 capitalize w-full'>Search Console Private Key</label>
                           <textarea
                              className={`w-full p-2 border border-gray-200 rounded mb-3 text-xs 
                              focus:outline-none h-[100px] focus:border-blue-200`}
                              value={domainSettings?.search_console?.private_key || ''}
                              placeholder={'-----BEGIN PRIVATE KEY-----/ssssaswdkihad....'}
                              onChange={(event) => setDomainSettings({
                                 ...domainSettings,
                                 search_console: { ...(domainSettings.search_console as DomainSearchConsole), private_key: event.target.value },
                              })}
                           />
                        </div>
                     </>
                  )}
               </div>
               {!isUpdating && (domainUpdateError as Error)?.message && (
                  <div className='w-full mt-4 p-3 text-sm bg-red-50 text-red-700'>{(domainUpdateError as Error).message}</div>
               )}
               {!isUpdating && settingsError?.msg && (
                  <div className='w-full mt-4 p-3 text-sm bg-red-50 text-red-700'>{settingsError.msg}</div>
               )}
            </div>

            <div className="flex justify-between border-t-[1px] border-gray-100 mt-8 pt-4 pb-0">
               <button
               className="text-sm font-semibold text-red-500"
               onClick={() => setShowRemoveDomain(true)}>
                  <Icon type="trash" /> Remove Domain
               </button>
               <button
               className={`text-sm font-semibold py-2 px-5 rounded cursor-pointer bg-blue-700 text-white ${isUpdating ? 'cursor-not-allowed' : ''}`}
               onClick={() => !isUpdating && updateDomain()}>
                  {isUpdating && <Icon type='loading' />} Update Settings
               </button>
            </div>
         </Modal>
         {showRemoveDomain && domain && (
            <Modal closeModal={() => setShowRemoveDomain(false) } title={`Remove Domain ${domain.domain}`}>
               <div className='text-sm'>
                  <p>Are you sure you want to remove this Domain? Removing this domain will remove all its keywords.</p>
                  <div className='mt-6 text-right font-semibold'>
                     <button
                     className=' py-1 px-5 rounded cursor-pointer bg-indigo-50 text-slate-500 mr-3'
                     onClick={() => setShowRemoveDomain(false)}>
                        Cancel
                     </button>
                     <button
                     className=' py-1 px-5 rounded cursor-pointer bg-red-400 text-white'
                     onClick={() => deleteMutate(domain)}>
                        Remove

                     </button>
                  </div>
               </div>
            </Modal>
         )}
      </div>
   );
};

export default DomainSettings;
