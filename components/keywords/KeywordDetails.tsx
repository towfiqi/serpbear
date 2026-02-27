import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import Icon from '../common/Icon';
import countries from '../../utils/countries';
import Chart from '../common/Chart';
import SelectField from '../common/SelectField';
import { useFetchSingleKeyword } from '../../services/keywords';
import useOnKey from '../../hooks/useOnKey';
import { generateTheChartData } from '../../utils/client/generateChartData';

type KeywordDetailsProps = {
   keyword: KeywordType,
   closeDetails: Function
}

type ResultSegment = { type: 'result', item: KeywordLastResult } | { type: 'skipped', from: number, to: number };

const KeywordDetails = ({ keyword, closeDetails }:KeywordDetailsProps) => {
   const updatedDate = new Date(keyword.lastUpdated);
   const [chartTime, setChartTime] = useState<string>('30');
   const searchResultContainer = useRef<HTMLDivElement>(null);
   const searchResultFound = useRef<HTMLDivElement>(null);
   const { data: keywordData } = useFetchSingleKeyword(keyword.ID);
   const keywordHistory: KeywordHistory = keywordData?.history || keyword.history;
   const keywordSearchResult: KeywordLastResult[] = useMemo(
      () => keywordData?.searchResult || keyword.lastResult || [],
      [keywordData, keyword.lastResult],
   );
   const dateOptions = [
      { label: 'Last 7 Days', value: '7' },
      { label: 'Last 30 Days', value: '30' },
      { label: 'Last 90 Days', value: '90' },
      { label: '1 Year', value: '360' },
      { label: 'All Time', value: 'all' },
   ];

   useOnKey('Escape', closeDetails);

   useLayoutEffect(() => {
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

   // Derive summary stats from lastResult
   const { scrapedCount, skippedCount, resultSegments } = useMemo(() => {
      const results = Array.isArray(keywordSearchResult) ? keywordSearchResult : [];
      const scraped = results.filter((r) => !r.skipped).length;
      const skipped = results.filter((r) => r.skipped).length;

      // Build segments: consecutive skipped items are grouped into one block
      const segs: ResultSegment[] = [];
      let skippedStart: number | null = null;
      let skippedEnd: number = 0;

      for (let i = 0; i < results.length; i += 1) {
         const item = results[i];
         if (item.skipped) {
            if (skippedStart === null) { skippedStart = item.position; }
            skippedEnd = item.position;
         } else {
            if (skippedStart !== null) {
               segs.push({ type: 'skipped', from: skippedStart, to: skippedEnd });
               skippedStart = null;
            }
            segs.push({ type: 'result', item });
         }
      }
      if (skippedStart !== null) {
         segs.push({ type: 'skipped', from: skippedStart, to: skippedEnd });
      }

      return { scrapedCount: scraped, skippedCount: skipped, resultSegments: segs };
   }, [keywordSearchResult]);

   // Label shown when keyword is not found
   const notFoundLabel = skippedCount > 0 ? `Not in First ${scrapedCount}` : 'Not in First 100';

   const closeOnBGClick = (e:React.SyntheticEvent) => {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      if (e.target === e.currentTarget) { closeDetails(); }
   };

   return (
       <div className="keywordDetails fixed w-full h-screen top-0 left-0 z-[99999]" onClick={closeOnBGClick} data-testid="keywordDetails">
            <div className="keywordDetails absolute w-full lg:w-5/12 bg-white customShadow top-0 right-0 h-screen" >
               <div className='keywordDetails__header p-6 border-b border-b-slate-200 text-slate-600'>
                  <h3 className=' text-lg font-bold'>
                     <span title={countries[keyword.country][0]}
                     className={`fflag fflag-${keyword.country} w-[18px] h-[12px] mr-2`} /> {keyword.keyword}
                     <span
                     className={`py-1 px-2 ml-2 rounded bg-blue-50 ${keyword.position === 0 ? 'text-gray-500' : 'text-blue-700'}  text-xs font-bold`}>
                        {keyword.position === 0 ? notFoundLabel : keyword.position}
                     </span>
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
                           <Chart labels={chartData.labels} series={chartData.series} />
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
                     {skippedCount > 0 && (
                        <div className='mb-4 p-3 rounded bg-blue-50 border border-blue-100 text-xs text-blue-600'>
                           {scrapedCount} result{scrapedCount !== 1 ? 's' : ''} scraped
                           {' • '}
                           {skippedCount} position{skippedCount !== 1 ? 's' : ''} skipped
                           {' (scrape strategy limits pages checked)'}
                        </div>
                     )}
                     <div className='keywordDetails__section__results styled-scrollbar overflow-y-auto' ref={searchResultContainer}>
                        {resultSegments.length > 0 && resultSegments.map((seg, idx) => {
                           if (seg.type === 'skipped') {
                              const pageFrom = Math.ceil(seg.from / 10);
                              const pageTo = Math.ceil(seg.to / 10);
                              const count = seg.to - seg.from + 1;
                              const pagesLabel = pageFrom === pageTo ? `Page ${pageFrom}` : `Pages ${pageFrom}–${pageTo}`;
                              return (
                                 <div key={`skipped-${seg.from}`}
                                 className={'leading-6 mb-4 mr-3 px-3 py-2 text-sm rounded '
                                    + 'bg-gray-50 border border-dashed border-gray-200 text-gray-400 italic'}>
                                    {pagesLabel}: {count} result{count !== 1 ? 's' : ''} skipped
                                 </div>
                              );
                           }
                           const { position } = keyword;
                           const domainExist = position > 0 && seg.item.position === position;
                           return (
                              <div
                              ref={domainExist ? searchResultFound : null}
                              className={`leading-6 mb-4 mr-3 p-3 text-sm break-all pr-3 rounded 
                              ${domainExist ? ' bg-amber-50 border border-amber-200' : ''}`}
                              key={seg.item.url + seg.item.position}>
                                 <h4 className='font-semibold text-blue-700'>
                                    <a href={seg.item.url} target="_blank" rel='noreferrer'>{`${seg.item.position}. ${seg.item.title}`}</a>
                                 </h4>
                                 <a className=' text-green-900' href={seg.item.url} target="_blank" rel='noreferrer'>{seg.item.url}</a>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               </div>
            </div>
       </div>
   );
};

export default KeywordDetails;
