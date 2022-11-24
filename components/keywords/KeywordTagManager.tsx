import { useState } from 'react';
import { useUpdateKeywordTags } from '../../services/keywords';
import Icon from '../common/Icon';
import Modal from '../common/Modal';

type keywordTagManagerProps = {
   keyword: KeywordType|undefined,
   closeModal: Function,
   allTags: string[]
}

const KeywordTagManager = ({ keyword, closeModal }: keywordTagManagerProps) => {
   const [tagInput, setTagInput] = useState('');
   const [inputError, setInputError] = useState('');
   const { mutate: updateMutate } = useUpdateKeywordTags(() => { setTagInput(''); });

   const removeTag = (tag:String) => {
      if (!keyword) { return; }
      const newTags = keyword.tags.filter((t) => t !== tag.trim());
      updateMutate({ tags: { [keyword.ID]: newTags } });
   };

   const addTag = () => {
      if (!keyword) { return; }
      if (!tagInput) {
         setInputError('Please Insert a Tag!');
         setTimeout(() => { setInputError(''); }, 3000);
         return;
      }
      if (keyword.tags.includes(tagInput)) {
         setInputError('Tag Exist!');
         setTimeout(() => { setInputError(''); }, 3000);
         return;
      }

      console.log('New Tag: ', tagInput);
      const newTags = [...keyword.tags, tagInput.trim()];
      updateMutate({ tags: { [keyword.ID]: newTags } });
   };

   return (
      <Modal closeModal={() => { closeModal(false); }} title={`Tags for Keyword "${keyword && keyword.keyword}"`}>
         <div className="text-sm my-8 ">
            {keyword && keyword.tags.length > 0 && (
               <ul>
                  {keyword.tags.map((tag:string) => {
                     return <li key={tag} className={'inline-block bg-slate-50 py-1 px-3 border rounded mr-4 mb-3 text-slate-500'}>
                                 <Icon type="tags" size={14} classes="mr-2" />{tag}
                                 <button
                                 className="ml-1 cursor-pointer rounded px-1 hover:bg-red-200 hover:text-red-700"
                                 onClick={() => removeTag(tag)}>
                                    <Icon type="close" size={14} />
                                 </button>
                           </li>;
                  })}
               </ul>
            )}
            {keyword && keyword.tags.length === 0 && (
               <div className="text-center w-full text-gray-500">No Tags Added to this Keyword.</div>
            )}
         </div>
         <div className="relative">
            {inputError && <span className="absolute top-[-24px] text-red-400 text-sm font-semibold">{inputError}</span>}
            <span className='absolute text-gray-400 top-3 left-2'><Icon type="tags" size={16} /></span>
            <input
               className='w-full border rounded border-gray-200 py-3 px-4 pl-8 outline-none focus:border-indigo-300'
               placeholder='Insert Tags'
               value={tagInput}
               onChange={(e) => setTagInput(e.target.value)}
               onKeyDown={(e) => {
                  if (e.code === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
               }}
            />
            <button className=" absolute right-2 top-2 cursor-pointer rounded p-1 px-4 bg-blue-600 text-white font-bold" onClick={addTag}>+</button>
         </div>
      </Modal>

   );
};

export default KeywordTagManager;
