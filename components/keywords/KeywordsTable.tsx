import React, { useState, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import { CSSTransition } from 'react-transition-group';
import AddKeywords from './AddKeywords';
import { filterKeywords, keywordsByDevice, sortKeywords } from '../../utils/sortFilter';
import Icon from '../common/Icon';
import Keyword from './Keyword';
import KeywordDetails from './KeywordDetails';
import KeywordFilters from './KeywordFilter';
import Modal from '../common/Modal';
import { useDeleteKeywords, useFavKeywords, useRefreshKeywords } from '../../services/keywords';
import KeywordTagManager from './KeywordTagManager';
import AddTags from './AddTags';

type KeywordsTableProps = {
   domain: DomainType | null,
   keywords: KeywordType[],
   isLoading: boolean,
   showAddModal: boolean,
   setShowAddModal: Function,
   isConsoleIntegrated: boolean,
}

const KeywordsTable = (props: KeywordsTableProps) => {
   const { domain, keywords = [], isLoading = true, showAddModal = false, setShowAddModal, isConsoleIntegrated = false } = props;
   const showSCData = isConsoleIntegrated;
   const [device, setDevice] = useState<string>('desktop');
   const [selectedKeywords, setSelectedKeywords] = useState<number[]>([]);
   const [showKeyDetails, setShowKeyDetails] = useState<KeywordType|null>(null);
   const [showRemoveModal, setShowRemoveModal] = useState<boolean>(false);
   const [showTagManager, setShowTagManager] = useState<null|number>(null);
   const [showAddTags, setShowAddTags] = useState<boolean>(false);
   const [filterParams, setFilterParams] = useState<KeywordFilters>({ countries: [], tags: [], search: '' });
   const [sortBy, setSortBy] = useState<string>('date_asc');
   const [scDataType, setScDataType] = useState<string>('threeDays');
   const [showScDataTypes, setShowScDataTypes] = useState<boolean>(false);
   const { mutate: deleteMutate } = useDeleteKeywords(() => {});
   const { mutate: favoriteMutate } = useFavKeywords(() => {});
   const { mutate: refreshMutate } = useRefreshKeywords(() => {});

   const scDataObject:{ [k:string] : string} = {
      threeDays: 'Last Three Days',
      sevenDays: 'Last Seven Days',
      thirtyDays: 'Last Thirty Days',
      avgSevenDays: 'Last Three Days Avg',
      avgThreeDays: 'Last Seven Days Avg',
      avgThirtyDays: 'Last Thirty Days Avg',
   };

   const processedKeywords: {[key:string] : KeywordType[]} = useMemo(() => {
      const procKeywords = keywords.filter((x) => x.device === device);
      const filteredKeywords = filterKeywords(procKeywords, filterParams);
      const sortedKeywords = sortKeywords(filteredKeywords, sortBy, scDataType);
      return keywordsByDevice(sortedKeywords, device);
   }, [keywords, device, sortBy, filterParams, scDataType]);

   const allDomainTags: string[] = useMemo(() => {
      const allTags = keywords.reduce((acc: string[], keyword) => [...acc, ...keyword.tags], []);
      return [...new Set(allTags)];
   }, [keywords]);

   const selectKeyword = (keywordID: number) => {
      console.log('Select Keyword: ', keywordID);
      let updatedSelectd = [...selectedKeywords, keywordID];
      if (selectedKeywords.includes(keywordID)) {
         updatedSelectd = selectedKeywords.filter((keyID) => keyID !== keywordID);
      }
      setSelectedKeywords(updatedSelectd);
   };

   const selectedAllItems = selectedKeywords.length === processedKeywords[device].length;

   return (
      <div>
         <div className='domKeywords flex flex-col bg-[white] rounded-md text-sm border mb-8'>
            {selectedKeywords.length > 0 && (
               <div className='font-semibold text-sm py-4 px-8 text-gray-500 '>
                  <ul className=''>
                     <li className='inline-block mr-4'>
                        <a
                        className='block px-2 py-2 cursor-pointer hover:text-indigo-600'
                        onClick={() => { refreshMutate({ ids: selectedKeywords }); setSelectedKeywords([]); }}
                        >
                           <span className=' bg-indigo-100 text-blue-700 px-1 rounded'><Icon type="reload" size={11} /></span> Refresh Keywords
                        </a>
                     </li>
                     <li className='inline-block mr-4'>
                        <a
                        className='block px-2 py-2 cursor-pointer hover:text-indigo-600'
                        onClick={() => setShowRemoveModal(true)}
                        >
                           <span className=' bg-red-100 text-red-600 px-1 rounded'><Icon type="trash" size={14} /></span> Remove Keywords</a>
                     </li>
                     <li className='inline-block mr-4'>
                        <a
                        className='block px-2 py-2 cursor-pointer hover:text-indigo-600'
                        onClick={() => setShowAddTags(true)}
                        >
                           <span className=' bg-green-100 text-green-500  px-1 rounded'><Icon type="tags" size={14} /></span> Tag Keywords</a>
                     </li>
                  </ul>
               </div>
            )}
            {selectedKeywords.length === 0 && (
               <KeywordFilters
                  allTags={allDomainTags}
                  filterParams={filterParams}
                  filterKeywords={(params:KeywordFilters) => setFilterParams(params)}
                  updateSort={(sorted:string) => setSortBy(sorted)}
                  sortBy={sortBy}
                  keywords={keywords}
                  device={device}
                  setDevice={setDevice}
                  integratedConsole={isConsoleIntegrated}
               />
            )}
            <div className={`domkeywordsTable domkeywordsTable--keywords ${showSCData ? 'domkeywordsTable--hasSC' : ''} 
               styled-scrollbar w-full overflow-auto min-h-[60vh]`}>
               <div className=' lg:min-w-[800px]'>
                  <div className={`domKeywords_head domKeywords_head--${sortBy} hidden lg:flex p-3 px-6 bg-[#FCFCFF]
                   text-gray-600 justify-between items-center font-semibold border-y`}>
                     <span className='domKeywords_head_keyword flex-1 basis-20 w-auto '>
                     {processedKeywords[device].length > 0 && (
                        <button
                           className={`p-0 mr-2 leading-[0px] inline-block rounded-sm pt-0 px-[1px] pb-[3px]  border border-slate-300 
                           ${selectedAllItems ? ' bg-blue-700 border-blue-700 text-white' : 'text-transparent'}`}
                           onClick={() => setSelectedKeywords(selectedAllItems ? [] : processedKeywords[device].map((k: KeywordType) => k.ID))}
                           >
                              <Icon type="check" size={10} />
                        </button>
                     )}
                        Keyword
                     </span>
                     <span className='domKeywords_head_position flex-1 basis-40 grow-0 text-center'>Position</span>
                     <span className='domKeywords_head_history flex-1'>History (7d)</span>
                     <span className='domKeywords_head_url flex-1'>URL</span>
                     <span className='domKeywords_head_updated flex-1'>Updated</span>
                     {showSCData && (
                        <div className='domKeywords_head_sc flex-1 min-w-[170px] mr-7 text-center'>
                           {/* Search Console */}
                           <div>
                              <div
                              className=' w-48 select-none cursor-pointer absolute bg-white rounded-full
                              px-2 py-[2px] mt-[-22px] ml-3 border border-gray-200 z-50'
                              onClick={() => setShowScDataTypes(!showScDataTypes)}>
                                 <Icon type="google" size={13} /> {scDataObject[scDataType]}
                                 <Icon classes="ml-2" type={showScDataTypes ? 'caret-up' : 'caret-down'} size={10} />
                              </div>
                              {showScDataTypes && (
                                 <div className='absolute bg-white border border-gray-200 z-50 w-44 rounded mt-2 ml-5 text-gray-500'>
                                    {Object.keys(scDataObject).map((itemKey) => {
                                       return <span
                                                className={`block p-2 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600
                                                 ${scDataType === itemKey ? 'bg-indigo-100 text-indigo-600' : ''}`}
                                                key={itemKey}
                                                onClick={() => { setScDataType(itemKey); setShowScDataTypes(false); }}>
                                                   {scDataObject[itemKey]}
                                                </span>;
                                    })}
                                 </div>
                              )}
                           </div>
                           <div className='relative top-2 flex justify-between'>
                              <span className='min-w-[40px]'>Pos</span>
                              <span className='min-w-[40px]'>Imp</span>
                              <span className='min-w-[40px]'>Visits</span>
                              {/* <span>CTR</span> */}
                           </div>
                        </div>
                     )}
                  </div>
                  <div className='domKeywords_keywords border-gray-200 min-h-[55vh] relative'>
                     {processedKeywords[device] && processedKeywords[device].length > 0
                        && processedKeywords[device].map((keyword, index) => <Keyword
                                                      key={keyword.ID}
                                                      selected={selectedKeywords.includes(keyword.ID)}
                                                      selectKeyword={selectKeyword}
                                                      keywordData={keyword}
                                                      refreshkeyword={() => refreshMutate({ ids: [keyword.ID] })}
                                                      favoriteKeyword={favoriteMutate}
                                                      manageTags={() => setShowTagManager(keyword.ID)}
                                                      removeKeyword={() => { setSelectedKeywords([keyword.ID]); setShowRemoveModal(true); }}
                                                      showKeywordDetails={() => setShowKeyDetails(keyword)}
                                                      lastItem={index === (processedKeywords[device].length - 1)}
                                                      showSCData={showSCData}
                                                      scDataType={scDataType}
                                                      />)}
                     {!isLoading && processedKeywords[device].length === 0 && (
                        <p className=' p-9 pt-[10%] text-center text-gray-500'>No Keywords Added for this Device Type.</p>
                     )}
                     {isLoading && (
                        <p className=' p-9 pt-[10%] text-center text-gray-500'>Loading Keywords...</p>
                     )}
                  </div>
               </div>
            </div>
         </div>
         {showKeyDetails && showKeyDetails.ID && (
            <KeywordDetails keyword={showKeyDetails} closeDetails={() => setShowKeyDetails(null)} />
         )}
         {showRemoveModal && selectedKeywords.length > 0 && (
            <Modal closeModal={() => { setSelectedKeywords([]); setShowRemoveModal(false); }} title={'Remove Keywords'}>
                  <div className='text-sm'>
                     <p>Are you sure you want to remove {selectedKeywords.length > 1 ? 'these' : 'this'} Keyword?</p>
                     <div className='mt-6 text-right font-semibold'>
                        <button
                        className=' py-1 px-5 rounded cursor-pointer bg-indigo-50 text-slate-500 mr-3'
                        onClick={() => { setSelectedKeywords([]); setShowRemoveModal(false); }}>
                           Cancel
                        </button>
                        <button
                        className=' py-1 px-5 rounded cursor-pointer bg-red-400 text-white'
                        onClick={() => { deleteMutate(selectedKeywords); setShowRemoveModal(false); setSelectedKeywords([]); }}>
                           Remove
                        </button>
                     </div>
                  </div>
            </Modal>
         )}
         <CSSTransition in={showAddModal} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <AddKeywords
               domain={domain?.domain || ''}
               keywords={keywords}
               closeModal={() => setShowAddModal(false)}
               />
         </CSSTransition>
         {showTagManager && (
            <KeywordTagManager
               allTags={allDomainTags}
               keyword={keywords.find((k) => k.ID === showTagManager)}
               closeModal={() => setShowTagManager(null)}
               />
         )}
         {showAddTags && (
            <AddTags
               keywords={keywords.filter((k) => selectedKeywords.includes(k.ID))}
               closeModal={() => setShowAddTags(false)}
               />
         )}
         <Toaster position='bottom-center' containerClassName="react_toaster" />
      </div>
   );
 };

 export default KeywordsTable;
