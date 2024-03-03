import { useRouter } from 'next/router';
import React, { useState, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import { useQuery } from 'react-query';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { useAddKeywords } from '../../services/keywords';
import Icon from '../common/Icon';
import KeywordIdea from './KeywordIdea';
import useWindowResize from '../../hooks/useWindowResize';
import useIsMobile from '../../hooks/useIsMobile';
import { IdeasSortKeywords, IdeasfilterKeywords } from '../../utils/client/IdeasSortFilter';
import IdeasFilters from './IdeasFilter';
import { useMutateFavKeywordIdeas } from '../../services/adwords';
import IdeaDetails from './IdeaDetails';
import { fetchDomains } from '../../services/domains';
import SelectField from '../common/SelectField';

type IdeasKeywordsTableProps = {
   domain: DomainType | null,
   keywords: IdeaKeyword[],
   favorites: IdeaKeyword[],
   noIdeasDatabase: boolean,
   isLoading: boolean,
   showFavorites: boolean,
   setShowFavorites: Function,
   isAdwordsIntegrated: boolean,
}

const IdeasKeywordsTable = ({
   domain, keywords = [], favorites = [], isLoading = true, isAdwordsIntegrated = true, setShowFavorites,
   showFavorites = false, noIdeasDatabase = false }: IdeasKeywordsTableProps) => {
   const router = useRouter();
   const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
   const [showKeyDetails, setShowKeyDetails] = useState<IdeaKeyword|null>(null);
   const [filterParams, setFilterParams] = useState<KeywordFilters>({ countries: [], tags: [], search: '' });
   const [sortBy, setSortBy] = useState<string>('imp_desc');
   const [listHeight, setListHeight] = useState(500);
   const [addKeywordDevice, setAddKeywordDevice] = useState<'desktop'|'mobile'>('desktop');
   const [addKeywordDomain, setAddKeywordDomain] = useState('');
   const { mutate: addKeywords } = useAddKeywords(() => { if (domain && domain.slug) router.push(`/domain/${domain.slug}`); });
   const { mutate: faveKeyword, isLoading: isFaving } = useMutateFavKeywordIdeas(router);
   const [isMobile] = useIsMobile();
   const isResearchPage = router.pathname === '/research';

   const { data: domainsData } = useQuery('domains', () => fetchDomains(router, false), { enabled: selectedKeywords.length > 0, retry: false });
   const theDomains: DomainType[] = (domainsData && domainsData.domains) || [];

   useWindowResize(() => setListHeight(window.innerHeight - (isMobile ? 200 : 400)));

   const finalKeywords: IdeaKeyword[] = useMemo(() => {
      const filteredKeywords = IdeasfilterKeywords(showFavorites ? favorites : keywords, filterParams);
      const sortedKeywords = IdeasSortKeywords(filteredKeywords, sortBy);
      return sortedKeywords;
   }, [keywords, showFavorites, favorites, filterParams, sortBy]);

   const favoriteIDs: string[] = useMemo(() => favorites.map((fav) => fav.uid), [favorites]);

   const allTags:string[] = useMemo(() => {
      const wordTags: Map<string, number> = new Map();
      keywords.forEach((k) => {
         const keywordsArray = k.keyword.split(' ');
         const keywordFirstTwoWords = keywordsArray.slice(0, 2).join(' ');
         const keywordFirstTwoWordsReversed = keywordFirstTwoWords.split(' ').reverse().join(' ');
         if (!wordTags.has(keywordFirstTwoWordsReversed)) {
            wordTags.set(keywordFirstTwoWords, 0);
         }
      });
      [...wordTags].forEach((tag) => {
         const foundTags = keywords.filter((kw) => kw.keyword.includes(tag[0]) || kw.keyword.includes(tag[0].split(' ').reverse().join(' ')));
         if (foundTags.length < 3) {
            wordTags.delete(tag[0]);
         } else {
            wordTags.set(tag[0], foundTags.length);
         }
      });
      const finalWordTags = [...wordTags].sort((a, b) => (a[1] > b[1] ? -1 : 1)).map((t) => `${t[0]} (${t[1]})`);
      return finalWordTags;
   }, [keywords]);

   const selectKeyword = (keywordID: string) => {
      let updatedSelectd = [...selectedKeywords, keywordID];
      if (selectedKeywords.includes(keywordID)) {
         updatedSelectd = selectedKeywords.filter((keyID) => keyID !== keywordID);
      }
      setSelectedKeywords(updatedSelectd);
   };

   const favoriteKeyword = (keywordID: string) => {
      if (!isFaving) {
         faveKeyword({ keywordID, domain: isResearchPage ? 'research' : domain?.slug });
      }
   };

   const addKeywordIdeasToTracker = () => {
      const selectedkeywords:KeywordAddPayload[] = [];
      keywords.forEach((kitem:IdeaKeyword) => {
         if (selectedKeywords.includes(kitem.uid)) {
            const { keyword, country } = kitem;
            selectedkeywords.push({
               keyword,
               device: addKeywordDevice,
               country,
               domain: isResearchPage ? addKeywordDomain : (domain?.domain || ''),
               tags: '',
            });
         }
      });
      addKeywords(selectedkeywords);
      setSelectedKeywords([]);
   };

   const selectedAllItems = selectedKeywords.length === finalKeywords.length;

   const Row = ({ data, index, style }:ListChildComponentProps) => {
      const keyword: IdeaKeyword = data[index];
      return (
         <KeywordIdea
         key={keyword.uid}
         style={style}
         selected={selectedKeywords.includes(keyword.uid)}
         selectKeyword={selectKeyword}
         favoriteKeyword={() => favoriteKeyword(keyword.uid)}
         showKeywordDetails={() => setShowKeyDetails(keyword)}
         isFavorite={favoriteIDs.includes(keyword.uid)}
         keywordData={keyword}
         lastItem={index === (finalKeywords.length - 1)}
         />
      );
   };

   return (
      <div>
         <div className='domKeywords flex flex-col bg-[white] rounded-md text-sm border mb-5'>
            {selectedKeywords.length > 0 && (
               <div className='font-semibold text-sm py-4 px-8 text-gray-500 '>
                  <div className={`inline-block ${isResearchPage ? ' mr-2' : ''}`}>Add Keywords to Tracker</div>
                  {isResearchPage && (
                     <SelectField
                     selected={[]}
                     options={theDomains.map((d) => ({ label: d.domain, value: d.domain }))}
                     defaultLabel={'Select a Domain'}
                     updateField={(updated:string[]) => updated[0] && setAddKeywordDomain(updated[0])}
                     emptyMsg="No Domains Found"
                     multiple={false}
                     inline={true}
                     rounded='rounded'
                     />
                  )}
                  <div className='inline-block ml-2'>
                     <button
                     className={`inline-block px-2 py-1 rounded-s 
                     ${addKeywordDevice === 'desktop' ? 'bg-indigo-100 text-blue-700' : 'bg-indigo-50 '}`}
                     onClick={() => setAddKeywordDevice('desktop')}>
                        {addKeywordDevice === 'desktop' ? '◉' : '○'} Desktop
                     </button>
                     <button
                     className={`inline-block px-2 py-1 rounded-e ${addKeywordDevice === 'mobile' ? 'bg-indigo-100 text-blue-700' : 'bg-indigo-50 '}`}
                     onClick={() => setAddKeywordDevice('mobile')}>
                        {addKeywordDevice === 'mobile' ? '◉' : '○'} Mobile
                     </button>
                  </div>
                  <a
                  className='inline-block px-2 py-2 cursor-pointer hover:text-indigo-600'
                  onClick={() => addKeywordIdeasToTracker()}
                  >
                     <span className=' text-white bg-blue-700 px-2 py-1 rounded font-semibold'>+ Add Keywords</span>
                  </a>
               </div>
            )}
            {selectedKeywords.length === 0 && (
               <IdeasFilters
                  allTags={allTags}
                  filterParams={filterParams}
                  filterKeywords={(params:KeywordFilters) => setFilterParams(params)}
                  updateSort={(sorted:string) => setSortBy(sorted)}
                  sortBy={sortBy}
                  keywords={keywords}
                  favorites={favorites}
                  showFavorites={(show:boolean) => { setShowFavorites(show); }}
               />
            )}
            <div className='domkeywordsTable domkeywordsTable--sckeywords styled-scrollbar w-full overflow-auto min-h-[60vh]'>
               <div className=' lg:min-w-[800px]'>
                  <div className={`domKeywords_head domKeywords_head--${sortBy} hidden lg:flex p-3 px-6 bg-[#FCFCFF]
                   text-gray-600 justify-between items-center font-semibold border-y`}>
                     <span className='domKeywords_head_keyword flex-1 basis-20 w-auto '>
                     {finalKeywords.length > 0 && (
                        <button
                           className={`p-0 mr-2 leading-[0px] inline-block rounded-sm pt-0 px-[1px] pb-[3px]  border border-slate-300 
                           ${selectedAllItems ? ' bg-blue-700 border-blue-700 text-white' : 'text-transparent'}`}
                           onClick={() => setSelectedKeywords(selectedAllItems ? [] : finalKeywords.map((k: IdeaKeyword) => k.uid))}
                           >
                              <Icon type="check" size={10} />
                        </button>
                     )}
                        Keyword
                     </span>
                     <span className='domKeywords_head_vol flex-1 text-center'>Monthly Search</span>
                     <span className='domKeywords_head_trend flex-1 text-center'>Search Trend</span>
                     <span className='domKeywords_head_competition flex-1 text-center'>Competition</span>
                  </div>
                  <div className='domKeywords_keywords border-gray-200 min-h-[55vh] relative' data-domain={domain?.domain}>
                     {!isLoading && finalKeywords && finalKeywords.length > 0 && (
                        <List
                        innerElementType="div"
                        itemData={finalKeywords}
                        itemCount={finalKeywords.length}
                        itemSize={isMobile ? 100 : 57}
                        height={listHeight}
                        width={'100%'}
                        className={'styled-scrollbar'}
                        >
                           {Row}
                        </List>
                     )}

                     {isAdwordsIntegrated && isLoading && (
                        <p className=' p-9 pt-[10%] text-center text-gray-500'>Loading Keywords Ideas...</p>
                     )}
                     {isAdwordsIntegrated && noIdeasDatabase && !isLoading && (
                        <p className=' p-9 pt-[10%] text-center text-gray-500'>
                           {'No keyword Ideas has been generated for this domain yet. Click the "Load Ideas" button to generate keyword ideas.'}
                        </p>
                     )}
                     {isAdwordsIntegrated && !isLoading && finalKeywords.length === 0 && !noIdeasDatabase && (
                        <p className=' p-9 pt-[10%] text-center text-gray-500'>
                           {'No Keyword Ideas found. Please try generating Keyword Ideas again by clicking the "Load Ideas" button.'}
                        </p>
                     )}
                     {!isAdwordsIntegrated && (
                        <p className=' p-9 pt-[10%] text-center text-gray-500'>
                           Google Ads has not been Integrated yet. Please follow <a className='text-indigo-600 underline' href='https://docs.serpbear.com/miscellaneous/integrate-google-ads' target="_blank" rel='noreferrer'>These Steps</a> to integrate Google Ads.
                        </p>
                     )}
                  </div>
               </div>
            </div>
         </div>
         {showKeyDetails && showKeyDetails.uid && (
            <IdeaDetails keyword={showKeyDetails} closeDetails={() => setShowKeyDetails(null)} />
         )}
         <Toaster position='bottom-center' containerClassName="react_toaster" />
      </div>
   );
 };

 export default IdeasKeywordsTable;
