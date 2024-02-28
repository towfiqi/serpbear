import React, { useState } from 'react';
import Icon from '../common/Icon';
import SelectField, { SelectionOption } from '../common/SelectField';

type IdeasFilterProps = {
   allTags: string[],
   filterParams: KeywordFilters,
   filterKeywords: Function,
   keywords: IdeaKeyword[],
   favorites: IdeaKeyword[],
   updateSort: Function,
   showFavorites: Function,
   sortBy: string,
}

const IdeasFilters = (props: IdeasFilterProps) => {
   const { filterKeywords, allTags = [], updateSort, showFavorites, sortBy, filterParams, keywords = [], favorites = [] } = props;
   const [keywordType, setKeywordType] = useState<'all'|'favorites'>('all');
   const [sortOptions, showSortOptions] = useState(false);
   const [filterOptions, showFilterOptions] = useState(false);

   const filterTags = (tags:string[]) => filterKeywords({ ...filterParams, tags });

   const searchKeywords = (event:React.FormEvent<HTMLInputElement>) => {
      const filtered = filterKeywords({ ...filterParams, search: event.currentTarget.value });
      return filtered;
   };

   const sortOptionChoices: SelectionOption[] = [
      { value: 'alpha_asc', label: 'Alphabetically(A-Z)' },
      { value: 'alpha_desc', label: 'Alphabetically(Z-A)' },
      { value: 'vol_asc', label: 'Lowest Search Volume' },
      { value: 'vol_desc', label: 'Highest Search Volume' },
      { value: 'competition_asc', label: 'High Competition' },
      { value: 'competition_desc', label: 'Low Competition' },
   ];

   const sortItemStyle = (sortType:string) => {
      return `cursor-pointer py-2 px-3 hover:bg-[#FCFCFF] ${sortBy === sortType ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-50' : ''}`;
   };

   const deviceTabStyle = 'select-none cursor-pointer px-3 py-2 rounded-3xl mr-2';
   const deviceTabCountStyle = 'px-2 py-0 rounded-3xl bg-[#DEE1FC] text-[0.7rem] font-bold ml-1';
   const mobileFilterOptionsStyle = 'visible mt-8 border absolute min-w-[0] rounded-lg max-h-96 bg-white z-50 w-52 right-2 p-4';

   return (
      <div className='domKeywords_filters py-4 px-6 flex justify-between text-sm text-gray-500 font-semibold border-b-[1px] lg:border-0 items-center'>
         <div>
            <ul className='flex text-xs'>
               <li
                data-testid="desktop_tab"
               className={`${deviceTabStyle} ${keywordType === 'all' ? ' bg-[#F8F9FF] text-gray-700' : ''}`}
               onClick={() => { setKeywordType('all'); showFavorites(false); }}>
                     <Icon type='keywords' classes='top-[3px]' size={15} />
                     <i className='hidden not-italic lg:inline-block ml-1'>All Keywords</i>
                     <span className={`${deviceTabCountStyle}`}>{keywords.length}</span>
               </li>
               <li
               data-testid="mobile_tab"
               className={`${deviceTabStyle} ${keywordType === 'favorites' ? ' bg-[#F8F9FF] text-gray-700' : ''}`}
               onClick={() => { setKeywordType('favorites'); showFavorites(true); }}>
                     <Icon type='star' classes='top-[4px]' />
                     <i className='hidden not-italic lg:inline-block ml-1'>Favorites</i>
                     <span className={`${deviceTabCountStyle}`}>{favorites.length}</span>
               </li>
            </ul>
         </div>

            <div className='flex gap-5'>

               <div className=' lg:hidden'>
                  <button
                  data-testid="filter_button"
                  className={`px-2 py-1 rounded ${filterOptions ? ' bg-indigo-100 text-blue-700' : ''}`}
                  title='Filter'
                  onClick={() => showFilterOptions(!filterOptions)}>
                     <Icon type="filter" size={18} />
                  </button>
               </div>
               <div className={`lg:flex gap-5 lg:visible ${filterOptions ? mobileFilterOptionsStyle : 'hidden'}`}>
                  {keywordType === 'all' && (
                     <div className={'tags_filter mb-2 lg:mb-0'}>
                        <SelectField
                           selected={filterParams.tags}
                           options={allTags.map((tag:string) => ({ label: tag, value: tag }))}
                           defaultLabel={`All Groups (${allTags.length})`}
                           updateField={(updated:string[]) => filterTags(updated)}
                           emptyMsg="No Groups Found for this Domain"
                           minWidth={270}
                        />
                     </div>
                  )}
                  <div className={'mb-2 lg:mb-0'}>
                     <input
                        data-testid="filter_input"
                        className={`border w-44 lg:w-36 focus:w-44 transition-all rounded-3xl 
                        p-1.5 px-4 outline-none ring-0 focus:border-indigo-200`}
                        type="text"
                        placeholder='Filter Keywords...'
                        onChange={searchKeywords}
                        value={filterParams.search}
                     />
                  </div>
               </div>
               <div className='relative'>
                  <button
                  data-testid="sort_button"
                  className={`px-2 py-1 rounded ${sortOptions ? ' bg-indigo-100 text-blue-700' : ''}`}
                  title='Sort'
                  onClick={() => showSortOptions(!sortOptions)}>
                     <Icon type="sort" size={18} />
                  </button>
                  {sortOptions && (
                     <ul
                     data-testid="sort_options"
                     className='sort_options mt-2 border absolute min-w-[0] right-0 rounded-lg
                     max-h-96 bg-white z-[9999] w-44 overflow-y-auto styled-scrollbar'>
                        {sortOptionChoices.map((sortOption) => {
                           return <li
                                    key={sortOption.value}
                                    className={sortItemStyle(sortOption.value)}
                                    onClick={() => { updateSort(sortOption.value); showSortOptions(false); }}>
                                       {sortOption.label}
                                    </li>;
                        })}
                     </ul>
                  )}
               </div>
            </div>

      </div>
   );
};

export default IdeasFilters;
