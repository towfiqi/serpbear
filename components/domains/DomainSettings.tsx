import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Icon from '../common/Icon';
import Modal from '../common/Modal';
import { useDeleteDomain, useUpdateDomain } from '../../services/domains';

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
   const [showRemoveDomain, setShowRemoveDomain] = useState<boolean>(false);
   const [settingsError, setSettingsError] = useState<DomainSettingsError>({ type: '', msg: '' });
   const [domainSettings, setDomainSettings] = useState<DomainSettings>({ notification_interval: 'never', notification_emails: '' });

   const { mutate: updateMutate } = useUpdateDomain(() => closeModal(false));
   const { mutate: deleteMutate } = useDeleteDomain(() => {
      closeModal(false);
      router.push('/domains');
   });

   useEffect(() => {
      if (domain) {
         setDomainSettings({ notification_interval: domain.notification_interval, notification_emails: domain.notification_emails });
      }
   }, [domain]);

   const updateNotiEmails = (event:React.FormEvent<HTMLInputElement>) => {
      setDomainSettings({ ...domainSettings, notification_emails: event.currentTarget.value });
   };

   const updateDomain = () => {
      console.log('Domain: ');
      let error: DomainSettingsError | null = null;
      if (domainSettings.notification_emails) {
         const notification_emails = domainSettings.notification_emails.split(',');
         const invalidEmails = notification_emails.find((x) => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(x) === false);
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

   return (
      <div>
         <Modal closeModal={() => closeModal(false)} title={'Domain Settings'} width="[500px]">
            <div data-testid="domain_settings" className=" text-sm">
               <div className="mb-6 flex justify-between items-center">
                  <h4>Notification Emails
                     {settingsError.type === 'email' && <span className="text-red-500 font-semibold ml-2">{settingsError.msg}</span>}
                  </h4>
                  <input
                     className={`border w-46 text-sm transition-all rounded p-1.5 px-4 outline-none ring-0 
                     ${settingsError.type === 'email' ? ' border-red-300' : ''}`}
                     type="text"
                     placeholder='Your Emails'
                     onChange={updateNotiEmails}
                     value={domainSettings.notification_emails || ''}
                  />
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
