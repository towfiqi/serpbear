import { useRouter } from 'next/router';
import { useState } from 'react';
import Icon from '../common/Icon';
import Modal from '../common/Modal';
import { useDeleteDomain, useUpdateDomain } from '../../services/domains';
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
      search_console: domain && domain.search_console ? JSON.parse(domain.search_console) : { property_type: 'domain', url: '' },
   }));

   const { mutate: updateMutate } = useUpdateDomain(() => closeModal(false));
   const { mutate: deleteMutate } = useDeleteDomain(() => {
      closeModal(false);
      router.push('/domains');
   });

   const updateDomain = () => {
      console.log('Domain: ');
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

   const tabStyle = 'inline-block px-4 py-1 rounded-full mr-3 cursor-pointer text-sm select-none';

   return (
      <div>
         <Modal closeModal={() => closeModal(false)} title={'Domain Settings'} width="[500px]">
            <div data-testid="domain_settings" className=" text-sm">
               <div className='mt-5 mb-5 '>
                  <ul>
                     <li
                     className={`${tabStyle} ${currentTab === 'notification' ? ' bg-blue-50 text-blue-600' : ''}`}
                     onClick={() => setCurrentTab('notification')}>
                        Notification
                     </li>
                     <li
                     className={`${tabStyle} ${currentTab === 'searchconsole' ? ' bg-blue-50 text-blue-600' : ''}`}
                     onClick={() => setCurrentTab('searchconsole')}>
                        Search Console
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
                              search_console: { ...domainSettings.search_console, property_type: updated[0] || 'domain' },
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
                                 search_console: { ...domainSettings.search_console, url },
                              })}
                              value={domainSettings?.search_console?.url || ''}
                              placeholder='Search Console Property URL. eg: https://mywebsite.com/'
                              />
                           </div>
                        )}
                     </>
                  )}
               </div>

            </div>

            <div className="flex justify-between border-t-[1px] border-gray-100 mt-8 pt-4 pb-0">
               <button
               className="text-sm font-semibold text-red-500"
               onClick={() => setShowRemoveDomain(true)}>
                  <Icon type="trash" /> Remove Domain
               </button>
               <button
               className='text-sm font-semibold py-2 px-5 rounded cursor-pointer bg-blue-700 text-white'
               onClick={() => updateDomain()}>
                  Update Settings
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
