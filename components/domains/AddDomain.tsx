import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useAddDomain } from '../../services/domains';
import { isValidDomain } from '../../utils/client/validators';

type AddDomainProps = {
   domains: DomainType[],
   closeModal: Function
}

const AddDomain = ({ closeModal, domains = [] }: AddDomainProps) => {
   const [newDomain, setNewDomain] = useState<string>('');
   const [newDomainError, setNewDomainError] = useState('');
   const { mutate: addMutate, isLoading: isAdding } = useAddDomain(() => closeModal());

   const addDomain = () => {
      setNewDomainError('');
      const existingDomains = domains.map((d) => d.domain);
      const insertedDomains = newDomain.split('\n');
      const domainsTobeAdded:string[] = [];
      const invalidDomains:string[] = [];
      insertedDomains.forEach((dom) => {
        const domain = dom.trim();
        if (isValidDomain(domain)) {
         if (!existingDomains.includes(domain)) {
            domainsTobeAdded.push(domain);
         }
        } else {
         invalidDomains.push(domain);
        }
      });
      if (invalidDomains.length > 0) {
         setNewDomainError(`Please Insert Valid Domain names. Invalid Domains: ${invalidDomains.join(', ')}`);
      } else if (domainsTobeAdded.length > 0) {
         // TODO: Domain Action
          addMutate(domainsTobeAdded);
      }
   };

   const handleDomainInput = (e:React.ChangeEvent<HTMLTextAreaElement>) => {
      if (e.currentTarget.value === '' && newDomainError) { setNewDomainError(''); }
      setNewDomain(e.currentTarget.value);
   };

   return (
      <Modal closeModal={() => { closeModal(false); }} title={'Add New Domain'}>
         <div data-testid="adddomain_modal">
            <h4 className='text-sm mt-4'>Domain Names</h4>
            <textarea
               className={`w-full h-40 border rounded border-gray-200 p-4 outline-none
                focus:border-indigo-300 ${newDomainError ? ' border-red-400 focus:border-red-400' : ''}`}
               placeholder="Type or Paste Domains here. Insert Each Domain in a New line."
               value={newDomain}
               autoFocus={true}
               onChange={handleDomainInput}>
            </textarea>
            {newDomainError && <div><span className=' ml-2 block float-right text-red-500 text-xs font-semibold'>{newDomainError}</span></div>}
            <div className='mt-6 text-right text-sm font-semibold'>
               <button className='py-2 px-5 rounded cursor-pointer bg-indigo-50 text-slate-500 mr-3' onClick={() => closeModal(false)}>Cancel</button>
               <button className='py-2 px-5 rounded cursor-pointer bg-blue-700 text-white' onClick={() => !isAdding && addDomain() }>
                   {isAdding ? 'Adding....' : 'Add Domain'}
               </button>
            </div>
         </div>
      </Modal>
   );
};

export default AddDomain;
