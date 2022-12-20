import React, { useState } from 'react';
import Icon from '../common/Icon';
import Modal from '../common/Modal';
import SelectField from '../common/SelectField';
import countries from '../../utils/countries';
import { useAddKeywords } from '../../services/keywords';

type AddKeywordsProps = {
   keywords: KeywordType[],
   closeModal: Function,
   domain: string
}

type KeywordsInput = {
   keywords: string,
   device: string,
   country: string,
   domain: string,
   tags: string,
}

const AddKeywords = ({ closeModal, domain, keywords }: AddKeywordsProps) => {
   const [error, setError] = useState<string>('');
   const [newKeywordsData, setNewKeywordsData] = useState<KeywordsInput>({ keywords: '', device: 'desktop', country: 'US', domain, tags: '' });
   const { mutate: addMutate, isLoading: isAdding } = useAddKeywords(() => closeModal(false));
   const deviceTabStyle = 'cursor-pointer px-3 py-2 rounded mr-2';

   const addKeywords = () => {
      if (newKeywordsData.keywords) {
         const keywordsArray = [...new Set(newKeywordsData.keywords.split('\n').map((item) => item.trim()).filter((item) => !!item))];
         const currentKeywords = keywords.map((k) => `${k.keyword}-${k.device}-${k.country}`);
         const keywordExist = keywordsArray.filter((k) => currentKeywords.includes(`${k}-${newKeywordsData.device}-${newKeywordsData.country}`));
         if (keywordExist.length > 0) {
            setError(`Keywords ${keywordExist.join(',')} already Exist`);
            setTimeout(() => { setError(''); }, 3000);
         } else {
            const { device, country, domain: kDomain, tags } = newKeywordsData;
            const newKeywordsArray = keywordsArray.map((nItem) => ({ keyword: nItem, device, country, domain: kDomain, tags }));
            addMutate(newKeywordsArray);
         }
      } else {
         setError('Please Insert a Keyword');
         setTimeout(() => { setError(''); }, 3000);
      }
   };

   return (
      <Modal closeModal={() => { closeModal(false); }} title={'Add New Keywords'} width="[420px]">
         <div data-testid="addkeywords_modal">
            <div>
               <div>
                  <textarea
                     className='w-full h-40 border rounded border-gray-200 p-4 outline-none focus:border-indigo-300'
                     placeholder="Type or Paste Keywords here. Insert Each keyword in a New line."
                     value={newKeywordsData.keywords}
                     onChange={(e) => setNewKeywordsData({ ...newKeywordsData, keywords: e.target.value })}>
                  </textarea>
               </div>

               <div className=' my-3 flex justify-between text-sm'>
                  <div>
                  <SelectField
                     multiple={false}
                     selected={[newKeywordsData.country]}
                     options={Object.keys(countries).map((countryISO:string) => { return { label: countries[countryISO][0], value: countryISO }; })}
                     defaultLabel='All Countries'
                     updateField={(updated:string[]) => setNewKeywordsData({ ...newKeywordsData, country: updated[0] })}
                     rounded='rounded'
                     maxHeight={48}
                     flags={true}
                  />
                  </div>
                  <ul className='flex text-xs font-semibold text-gray-500'>
                     <li
                        className={`${deviceTabStyle} ${newKeywordsData.device === 'desktop' ? '  bg-indigo-50 text-gray-700' : ''}`}
                        onClick={() => setNewKeywordsData({ ...newKeywordsData, device: 'desktop' })}
                        ><Icon type='desktop' classes={'top-[3px]'} size={15} /> <i className='not-italic hidden lg:inline-block'>Desktop</i></li>
                     <li
                        className={`${deviceTabStyle} ${newKeywordsData.device === 'mobile' ? '  bg-indigo-50 text-gray-700' : ''}`}
                        onClick={() => setNewKeywordsData({ ...newKeywordsData, device: 'mobile' })}
                        ><Icon type='mobile' /> <i className='not-italic hidden lg:inline-block'>Mobile</i></li>
                  </ul>
               </div>

               <div className='relative'>
                  {/* TODO:  Insert Existing Tags as Suggestions */}
                  <input
                     className='w-full border rounded border-gray-200 py-2 px-4 pl-8 outline-none focus:border-indigo-300'
                     placeholder='Insert Tags'
                     value={newKeywordsData.tags}
                     onChange={(e) => setNewKeywordsData({ ...newKeywordsData, tags: e.target.value })}
                  />
                  <span className='absolute text-gray-400 top-2 left-2'><Icon type="tags" size={16} /></span>
               </div>
            </div>
            {error && <div className='w-full mt-4 p-3 text-sm bg-red-50 text-red-700'>{error}</div>}
            <div className='mt-6 text-right text-sm font-semibold flex justify-between'>
               <button
                  className=' py-2 px-5 rounded cursor-pointer bg-indigo-50 text-slate-500 mr-3'
                  onClick={() => closeModal(false)}>
                     Cancel
               </button>
               <button
                  className=' py-2 px-5 rounded cursor-pointer bg-blue-700 text-white'
                  onClick={() => !isAdding && addKeywords()}>
                     {isAdding ? 'Adding....' : 'Add Keywords'}
               </button>
            </div>
         </div>
      </Modal>
   );
};

export default AddKeywords;
