import React, { useState, useMemo } from 'react';
import Icon from '../common/Icon';
import SelectField, { SelectionOption } from '../common/SelectField';
import countries from '../../utils/countries';

type KeywordFilterProps = {
   device: string,
   allTags: string[],
   setDevice: Function,
   filterParams: KeywordFilters,
   filterKeywords: Function,
   keywords: KeywordType[] | SearchAnalyticsItem[],
   updateSort: Function,
   sortBy: string,
   integratedConsole?: boolean,
   isConsole?: boolean,
   SCcountries?: string[];
   updateColumns?: Function,
   tableColumns?: string[]
}

const KeywordFilters = (props: KeywordFilterProps) => {
   const {
      device,
      setDevice,
      filterKeywords,
      allTags = [],
      keywords = [],
      updateSort,
      sortBy,
      filterParams,
      isConsole = false,
      integratedConsole = false,
      updateColumns,
      SCcountries = [],
      tableColumns = [],
    } = props;
   const [sortOptions, showSortOptions] = useState(false);
   const [filterOptions, showFilterOptions] = useState(false);
   const [columnOptions, showColumnOptions] = useState(false);

   const keywordCounts = useMemo(() => {
      const counts = { desktop: 0, mobile: 0 };
      if (keywords && keywords.length > 0) {
         keywords.forEach((k) => {
            if (k.device === 'desktop') {
               counts.desktop += 1;
            } else {
               counts.mobile += 1;
            }
         });
      }
      return counts;
   }, [keywords]);

   const filterCountry = (cntrs:string[]) => filterKeywords({ ...filterParams, countries: cntrs });

   const filterTags = (tags:string[]) => filterKeywords({ ...filterParams, tags });

   const searchKeywords = (event:React.FormEvent<HTMLInputElement>) => {
      const filtered = filterKeywords({ ...filterParams, search: event.currentTarget.value });
      return filtered;
   };

   const countryOptions = useMemo(() => {
      const optionObject:{label:string, value:string}[] = [];

      if (!isConsole) {
         const allCountries = Array.from(keywords as KeywordType[])
         .map((keyword) => keyword.country)
         .reduce<string[]>((acc, country) => [...acc, country], [])
         .filter((t) => t && t.trim() !== '');
         [...new Set(allCountries)].forEach((c) => optionObject.push({ label: countries[c][0], value: c }));
      } else {
         Object.keys(countries).forEach((countryISO:string) => {
            if ((SCcountries.includes(countryISO))) {
               optionObject.push({ label: countries[countryISO][0], value: countryISO });
            }
         });
      }

      return optionObject;
   }, [SCcountries, isConsole, keywords]);

   const sortOptionChoices: SelectionOption[] = [
      { value: 'pos_asc', label: 'Top Position' },
      { value: 'pos_desc', label: 'Lowest Position' },
      { value: 'date_asc', label: 'Most Recent (Default)' },
      { value: 'date_desc', label: 'Oldest' },
      { value: 'alpha_asc', label: 'Alphabetically(A-Z)' },
      { value: 'alpha_desc', label: 'Alphabetically(Z-A)' },
      { value: 'vol_asc', label: 'Lowest Search Volume' },
      { value: 'vol_desc', label: 'Highest Search Volume' },
   ];

   const columnOptionChoices: {label: string, value: string, locked: boolean}[] = [
      { value: 'Keyword', label: 'Keyword', locked: true },
      { value: 'Position', label: 'Position', locked: true },
      { value: 'URL', label: 'URL', locked: true },
      { value: 'Updated', label: 'Updated', locked: true },
      { value: 'Best', label: 'Best', locked: false },
      { value: 'History', label: 'History', locked: false },
      { value: 'Volume', label: 'Volume', locked: false },
      { value: 'Search Console', label: 'Search Console', locked: false },
   ];
   if (integratedConsole) {
      sortOptionChoices.push({ value: 'imp_desc', label: `Most Viewed${isConsole ? ' (Default)' : ''}` });
      sortOptionChoices.push({ value: 'imp_asc', label: 'Least Viewed' });
      sortOptionChoices.push({ value: 'visits_desc', label: 'Most Visited' });
      sortOptionChoices.push({ value: 'visits_asc', label: 'Least Visited' });
   }
   if (isConsole) {
      sortOptionChoices.splice(2, 2);
      sortOptionChoices.push({ value: 'ctr_asc', label: 'Highest CTR' });
      sortOptionChoices.push({ value: 'ctr_desc', label: 'Lowest CTR' });
   }
   const sortItemStyle = (sortType:string) => {
      return `cursor-pointer py-2 px-3 hover:bg-[#FCFCFF] ${sortBy === sortType ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-50' : ''}`;
   };
   const deviceTabStyle = 'select-none cursor-pointer px-3 py-2 rounded-3xl mr-2';
   const deviceTabCountStyle = 'px-2 py-0 rounded-3xl bg-[#DEE1FC] text-[0.7rem] font-bold ml-1';
   const mobileFilterOptionsStyle = 'visible mt-8 border absolute min-w-[0] rounded-lg max-h-96 bg-white z-50 w-52 right-2 p-4';

   return (
      <div className='domKeywords_filters py-4 px-6 flex justify-between text-sm text-gray-500 font-semibold border-b-[1px] lg:border-0'>
         <div>
            <ul className='flex text-xs'>
               <li
                data-testid="desktop_tab"
               className={`${deviceTabStyle} ${device === 'desktop' ? ' bg-[#F8F9FF] text-gray-700' : ''}`}
               onClick={() => setDevice('desktop')}>
                     <Icon type='desktop' classes='top-[3px]' size={15} />
                     <i className='hidden not-italic lg:inline-block ml-1'>Desktop</i>
                     <span className={`${deviceTabCountStyle}`}>{keywordCounts.desktop}</span>
               </li>
               <li
               data-testid="mobile_tab"
               className={`${deviceTabStyle} ${device === 'mobile' ? ' bg-[#F8F9FF] text-gray-700' : ''}`}
               onClick={() => setDevice('mobile')}>
                     <Icon type='mobile' />
                     <i className='hidden not-italic lg:inline-block ml-1'>Mobile</i>
                     <span className={`${deviceTabCountStyle}`}>{keywordCounts.mobile}</span>
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
               <div className={'country_filter mb-2 lg:mb-0'}>
                  <SelectField
                     selected={filterParams.countries}
                     options={countryOptions}
                     defaultLabel='All Countries'
                     updateField={(updated:string[]) => filterCountry(updated)}
                     flags={true}
                  />
               </div>
               {!isConsole && (
                  <div className={'tags_filter mb-2 lg:mb-0'}>
                     <SelectField
                        selected={filterParams.tags}
                        options={allTags.map((tag:string) => ({ label: tag, value: tag }))}
                        defaultLabel='All Tags'
                        updateField={(updated:string[]) => filterTags(updated)}
                        emptyMsg="No Tags Found for this Domain"
                     />
                  </div>
               )}
               <div className={'mb-2 lg:mb-0'}>
                  <input
                     data-testid="filter_input"
                     className={'border w-44 lg:w-36 focus:w-44 transition-all rounded-3xl p-1.5 px-4 outline-none ring-0 focus:border-indigo-200'}
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
                     className='sort_options mt-2 border absolute w-48 min-w-[0] right-0 rounded-lg
                     max-h-96 bg-white z-[9999] overflow-y-auto styled-scrollbar'>
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
               {!isConsole && (
                  <div className='relative'>
                  <button
                  data-testid="columns_button"
                  className={`px-2 py-1 rounded ${columnOptions ? ' bg-indigo-100 text-blue-700' : ''}`}
                  title='Show/Hide Columns'
                  onClick={() => showColumnOptions(!columnOptions)}
                  >
                     <Icon type='eye-closed' size={18} />
                  </button>
                  {columnOptions && (
                     <ul
                     data-testid="sort_options"
                     className='sort_options mt-2 border absolute w-48 min-w-[0] right-0 rounded-lg
                     max-h-96 bg-white z-[9999] overflow-y-auto styled-scrollbar border-gray-200 '>
                        {columnOptionChoices.map(({ value, label, locked }) => {
                           return <li
                                    key={value}
                                    className={sortItemStyle(value) + (locked ? 'bg-gray-50 cursor-not-allowed pointer-events-none' : '') }
                                    onClick={() => { if (updateColumns) { updateColumns(value); } showColumnOptions(false); }}
                                    >
                                       <span className={' inline-block px-[3px] border border-gray-200  rounded-[4px] w-5'}>
                                          <Icon
                                          title={locked ? 'Cannot be Hidden' : ''}
                                          type={locked ? 'lock' : 'check'}
                                          color={!tableColumns.includes(value) && !locked ? 'transparent' : '#999' }
                                          size={12}
                                          />
                                        </span>
                                       {' '}{label}

                                    </li>;
                        })}
                     </ul>
                  )}
               </div>
               )}
         </div>
      </div>
   );
};

export default KeywordFilters;
