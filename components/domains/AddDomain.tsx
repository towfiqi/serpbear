import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useAddDomain } from '../../services/domains';

type AddDomainProps = {
   closeModal: Function
}

const AddDomain = ({ closeModal }: AddDomainProps) => {
   const [newDomain, setNewDomain] = useState<string>('');
   const [newDomainError, setNewDomainError] = useState<boolean>(false);
   const { mutate: addMutate, isLoading: isAdding } = useAddDomain(() => closeModal());

   const addDomain = () => {
      // console.log('ADD NEW DOMAIN', newDomain);
      if (/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(newDomain.trim())) {
         setNewDomainError(false);
         // TODO: Domain Action
         addMutate(newDomain.trim());
      } else {
         setNewDomainError(true);
      }
   };

   const handleDomainInput = (e:React.FormEvent<HTMLInputElement>) => {
      if (e.currentTarget.value === '' && newDomainError) { setNewDomainError(false); }
      setNewDomain(e.currentTarget.value);
   };

   return (
      <Modal closeModal={() => { closeModal(false); }} title={'Add New Domain'}>
         <div data-testid="adddomain_modal">
            <h4 className='text-sm mt-4'>
               Domain Name {newDomainError && <span className=' ml-2 block float-right text-red-500 text-xs font-semibold'>Not a Valid Domain</span>}
            </h4>
            <input
               className={`w-full p-2 border border-gray-200 rounded mt-2 mb-3 focus:outline-none  focus:border-blue-200 
               ${newDomainError ? ' border-red-400 focus:border-red-400' : ''} `}
               type="text"
               value={newDomain}
               placeholder={'example.com'}
               onChange={handleDomainInput}
               autoFocus={true}
               onKeyDown={(e) => {
                  if (e.code === 'Enter') {
                    e.preventDefault();
                    addDomain();
                  }
               }}
            />
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
