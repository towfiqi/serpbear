import { useState } from 'react';
import { useUpdateKeywordTags } from '../../services/keywords';
import Icon from '../common/Icon';
import Modal from '../common/Modal';
import AddTags from './AddTags';

type keywordTagManagerProps = {
   keyword: KeywordType|undefined,
   closeModal: Function,
   allTags: string[]
}

const KeywordTagManager = ({ keyword, closeModal }: keywordTagManagerProps) => {
   const [showAddTag, setShowAddTag] = useState<boolean>(false);
   const { mutate: updateMutate } = useUpdateKeywordTags(() => { });

   const removeTag = (tag:String) => {
      if (!keyword) { return; }
      const newTags = keyword.tags.filter((t) => t !== tag.trim());
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
                  <li className='inline-block py-1 px-1'>
                     <button
                     title='Add New Tag'
                     className="cursor-pointer rounded p-1 px-3 bg-indigo-600 text-white font-semibold text-sm"
                     onClick={() => setShowAddTag(true)}>+</button>
                  </li>
               </ul>
            )}
            {keyword && keyword.tags.length === 0 && (
               <div className="text-center w-full text-gray-500">
                  No Tags Added to this Keyword. <button className=' text-indigo-600' onClick={() => setShowAddTag(true)}>+ Add Tag</button>
               </div>
            )}
         </div>
         {showAddTag && keyword && (
            <AddTags
               keywords={[keyword]}
               closeModal={() => setShowAddTag(false)}
               />
         )}
      </Modal>
   );
};

export default KeywordTagManager;
