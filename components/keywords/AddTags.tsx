import { useState } from 'react';
import { useUpdateKeywordTags } from '../../services/keywords';
import Icon from '../common/Icon';
import Modal from '../common/Modal';

type AddTagsProps = {
   keywords: KeywordType[],
   closeModal: Function
}

const AddTags = ({ keywords = [], closeModal }: AddTagsProps) => {
   const [tagInput, setTagInput] = useState('');
   const [inputError, setInputError] = useState('');
   const { mutate: updateMutate } = useUpdateKeywordTags(() => { setTagInput(''); });

   const addTag = () => {
      if (keywords.length === 0) { return; }
      if (!tagInput) {
         setInputError('Please Insert a Tag!');
         setTimeout(() => { setInputError(''); }, 3000);
         return;
      }

      const tagsArray = tagInput.split(',').map((t) => t.trim());
      const tagsPayload:any = {};
      keywords.forEach((keyword:KeywordType) => {
         tagsPayload[keyword.ID] = [...keyword.tags, ...tagsArray];
      });
      updateMutate({ tags: tagsPayload });
   };

   return (
      <Modal closeModal={() => { closeModal(false); }} title={`Add New Tags to ${keywords.length} Selected Keyword`}>
         <div className="relative">
            {inputError && <span className="absolute top-[-24px] text-red-400 text-sm font-semibold">{inputError}</span>}
            <span className='absolute text-gray-400 top-3 left-2'><Icon type="tags" size={16} /></span>
            <input
               className='w-full border rounded border-gray-200 py-3 px-4 pl-8 outline-none focus:border-indigo-300'
               placeholder='Insert Tags. eg: tag1, tag2'
               value={tagInput}
               onChange={(e) => setTagInput(e.target.value)}
               onKeyDown={(e) => {
                  if (e.code === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
               }}
            />
            <button
            className=" absolute right-2 top-2 cursor-pointer rounded p-2 px-4 bg-indigo-600 text-white font-semibold text-sm"
            onClick={addTag}>
               Apply
            </button>
         </div>
      </Modal>

   );
};

export default AddTags;
