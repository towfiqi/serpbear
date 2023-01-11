import React, { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import Icon from '../common/Icon';
import countries from '../../utils/countries';
import Chart from '../common/Chart';
import SelectField from '../common/SelectField';
import { generateTheChartData } from '../common/generateChartData';

type KeywordDetailsProps = {
   keyword: KeywordType,
   closeDetails: Function
}

const KeywordDetails = ({ keyword, closeDetails }:KeywordDetailsProps) => {
   const updatedDate = new Date(keyword.lastUpdated);
   const [keywordHistory, setKeywordHistory] = useState<KeywordHistory>(keyword.history);
   const [keywordSearchResult, setKeywordSearchResult] = useState<KeywordLastResult[]>([]);
   const [chartTime, setChartTime] = useState<string>('30');
   const searchResultContainer = useRef<HTMLDivElement>(null);
   const searchResultFound = useRef<HTMLDivElement>(null);
   const dateOptions = [
      { label: 'Last 7 Days', value: '7' },
      { label: 'Last 30 Days', value: '30' },
      { label: 'Last 90 Days', value: '90' },
      { label: '1 Year', value: '360' },
      { label: 'All Time', value: 'all' },
   ];

   useEffect(() => {
      const fetchFullKeyword = async () => {
         try {
            const fetchURL = `${window.location.origin}/api/keyword?id=${keyword.ID}`;
            const res = await fetch(fetchURL, { method: 'GET' }).then((result) => result.json());
            if (res.keyword) {
               console.log(res.keyword, new Date().getTime());
               setKeywordHistory(res.keyword.history || []);
               setKeywordSearchResult(res.keyword.lastResult || []);
            }
         } catch (error) {
            console.log(error);
         }
      };
      if (keyword.lastResult.length === 0) {
         fetchFullKeyword();
      }
   }, [keyword]);

   useEffect(() => {
      const closeModalonEsc = (event:KeyboardEvent) => {
         if (event.key === 'Escape') {
            console.log(event.key);
            closeDetails();
         }
      };
      window.addEventListener('keydown', closeModalonEsc, false);
      return () => {
         window.removeEventListener('keydown', closeModalonEsc, false);
      };
   }, [closeDetails]);

   useEffect(() => {
      if (keyword.position < 100 && keyword.position > 0 && searchResultFound?.current) {
         searchResultFound.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'start',
         });
      }
   }, [keywordSearchResult, keyword.position]);

   const chartData = useMemo(() => {
      return generateTheChartData(keywordHistory, chartTime);
   }, [keywordHistory, chartTime]);

   const closeOnBGClick = (e:React.SyntheticEvent) => {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      if (e.target === e.currentTarget) { closeDetails(); }
   };

   return (
       <div className="keywordDetails fixed w-full h-screen top-0 left-0 z-[99999]" onClick={closeOnBGClick} data-testid="keywordDetails">
            <div className="keywordDetails absolute w-full lg:w-5/12 bg-white customShadow top-0 right-0 h-screen" >
               <div className='keywordDetails__header p-6 border-b border-b-slate-200 text-slate-500'>
                  <h3 className=' text-lg font-bold'>
                     <span title={countries[keyword.country][0]}
                     className={`fflag fflag-${keyword.country} w-[18px] h-[12px] mr-2`} /> {keyword.keyword}
                     <span className='py-1 px-2 ml-2 rounded bg-blue-50 text-blue-700 text-xs font-bold'>{keyword.position}</span>
                  </h3>
                  <button
                  className='absolute top-2 right-2 p-2 px-3 text-gray-400 hover:text-gray-700 transition-all hover:rotate-90'
                  onClick={() => closeDetails()}>
                     <Icon type='close' size={24} />
                  </button>
               </div>
               <div className='keywordDetails__content p-6'>

                  <div className='keywordDetails__section'>
                     <div className="keywordDetails__section__head flex justify-between mb-5">
                        <h3 className=' font-bold text-gray-700 text-lg'>SERP History</h3>
                        <div className="keywordDetails__section__chart_select mr-3">
                           <SelectField
                           options={dateOptions}
                           selected={[chartTime]}
                           defaultLabel="Select Date"
                           updateField={(updatedTime:[string]) => setChartTime(updatedTime[0])}
                           multiple={false}
                           rounded={'rounded'}
                           />
                        </div>
                     </div>
                     <div className='keywordDetails__section__chart h-64'>
                           <Chart labels={chartData.labels} sreies={chartData.sreies} />
                     </div>
                  </div>
                  <div className='keywordDetails__section mt-10'>
                     <div className="keywordDetails__section__head flex justify-between items-center pb-4 mb-4 border-b border-b-slate-200">
                        <h3 className=' font-bold text-gray-700 lg:text-lg'>Google Search Result
                           <a className='text-gray-400 hover:text-indigo-600 inline-block ml-1 px-2 py-1'
                              href={`https://www.google.com/search?q=${encodeURI(keyword.keyword)}`}
                              target="_blank"
                              rel='noreferrer'>
                              <Icon type='link' size={14} />
                           </a>
                        </h3>
                        <span className=' text-xs text-gray-500'>{dayjs(updatedDate).format('MMMM D, YYYY')}</span>
                     </div>
                     <div className='keywordDetails__section__results styled-scrollbar overflow-y-auto' ref={searchResultContainer}>
                        {keywordSearchResult && Array.isArray(keywordSearchResult) && keywordSearchResult.length > 0 && (
                           keywordSearchResult.map((item, index) => {
                              const { position } = keyword;
                              const domainExist = position < 100 && index === (position - 1);
                              return (
                                 <div
                                 ref={domainExist ? searchResultFound : null}
                                 className={`leading-6 mb-4 mr-3 p-3 text-sm break-all pr-3 rounded 
                                 ${domainExist ? ' bg-amber-50 border border-amber-200' : ''}`}
                                 key={item.url + item.position}>
                                    <h4 className='font-semibold text-blue-700'>
                                       <a href={item.url} target="_blank" rel='noreferrer'>{`${index + 1}. ${item.title}`}</a>
                                    </h4>
                                    {/* <p>{item.description}</p> */}
                                    <a className=' text-green-900' href={item.url} target="_blank" rel='noreferrer'>{item.url}</a>
                                 </div>
                              );
                           })
                        )}
                     </div>
                  </div>
               </div>
            </div>
       </div>
   );
};

export default KeywordDetails;
