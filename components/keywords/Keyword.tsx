import React, { useState, useMemo } from 'react';
import TimeAgo from 'react-timeago';
import dayjs from 'dayjs';
import Icon from '../common/Icon';
import countries from '../../utils/countries';
import ChartSlim from '../common/ChartSlim';
import KeywordPosition from './KeywordPosition';
import { generateTheChartData } from '../../utils/client/generateChartData';
import { formattedNum } from '../../utils/client/helpers';

type KeywordProps = {
   keywordData: KeywordType,
   selected: boolean,
   index: number,
   refreshkeyword: Function,
   favoriteKeyword: Function,
   removeKeyword: Function,
   selectKeyword: (id: number, event: React.MouseEvent) => void,
   manageTags: Function,
   showKeywordDetails: Function,
   lastItem?:boolean,
   showSCData: boolean,
   scDataType: string,
   style: Object,
   maxTitleColumnWidth: number,
   tableColumns? : string[]
}

const Keyword = (props: KeywordProps) => {
   const {
      keywordData,
      refreshkeyword,
      favoriteKeyword,
      removeKeyword,
      selectKeyword,
      selected,
      showKeywordDetails,
      manageTags,
      lastItem,
      showSCData = true,
      style,
      index,
      scDataType = 'threeDays',
      tableColumns = [],
      maxTitleColumnWidth,
   } = props;
   const {
      keyword, domain, ID, city, position, url = '', lastUpdated, country, sticky, history = {}, updating = false, lastUpdateError = false, volume,
   } = keywordData;

   const [showOptions, setShowOptions] = useState(false);
   const [showPositionError, setPositionError] = useState(false);

   const turncatedURL = useMemo(() => {
      return url.replace(`https://${domain}`, '').replace(`https://www.${domain}`, '').replace(`http://${domain}`, '');
   }, [url, domain]);

   const chartData = useMemo(() => {
      return generateTheChartData(history, '7');
   }, [history]);

   const positionChange = useMemo(() => {
      let status = 0;
      if (Object.keys(history).length >= 2) {
         const historyArray = Object.keys(history).map((dateKey:string) => {
            return { date: new Date(dateKey).getTime(), dateRaw: dateKey, position: history[dateKey] };
         });
         const historySorted = historyArray.sort((a, b) => a.date - b.date);
         const previousPos = historySorted[historySorted.length - 2].position;
         status = previousPos === 0 ? position : previousPos - position;
         if (position === 0 && previousPos > 0) {
            status = previousPos - 100;
         }
      }
      return status;
   }, [history, position]);

   const bestPosition: false | {position: number, date: string} = useMemo(() => {
      let bestPos;
      if (Object.keys(history).length > 0) {
         const historyArray = Object.keys(history).map((itemID) => ({ date: itemID, position: history[itemID] }))
             .sort((a, b) => a.position - b.position).filter((el) => (el.position > 0));
         if (historyArray[0]) {
            bestPos = { ...historyArray[0] };
         }
      }

      return bestPos || false;
   }, [history]);

   const optionsButtonStyle = 'block px-2 py-2 cursor-pointer hover:bg-indigo-50 hover:text-blue-700';

   return (
      <div
      key={keyword + ID}
      style={style}
      className={`keyword relative py-5 px-4 text-gray-600 border-b-[1px] border-gray-200 lg:py-4 lg:px-6 lg:border-0 
      lg:flex lg:justify-between lg:items-center ${selected ? ' bg-indigo-50 keyword--selected' : ''} ${lastItem ? 'border-b-0' : ''}`}>

         <div className=' w-3/4 font-semibold cursor-pointer lg:flex-1 lg:shrink-0 lg:basis-28 lg:w-auto lg:flex lg:items-center'>
            <button
               data-testid={`keyword-checkbox-${ID}`}
               className={`p-0 mr-2 leading-[0px] inline-block rounded-sm pt-0 px-[1px] pb-[3px] border 
               ${selected ? ' bg-blue-700 border-blue-700 text-white' : 'text-transparent'}`}
               onClick={(e) => selectKeyword(ID, e)}
               >
                  <Icon type="check" size={10} />
            </button>
            <a
            style={{ maxWidth: `${maxTitleColumnWidth - 35}px` }}
            className={'py-2 hover:text-blue-600 lg:flex lg:items-center w-full'}
            onClick={() => showKeywordDetails()}
            title={keyword}
            >
               <span className={`fflag fflag-${country} w-[18px] h-[12px] mr-2`} title={countries[country][0]} />
               <span className='inline-block text-ellipsis overflow-hidden whitespace-nowrap w-[calc(100%-50px)]'>
                  {keyword}{city ? ` (${city})` : ''}
               </span>
            </a>
            {sticky && <button className='ml-2 relative top-[2px]' title='Favorite'><Icon type="star-filled" size={16} color="#fbd346" /></button>}
            {lastUpdateError && lastUpdateError.date
               && <button className='ml-2 relative top-[2px]' onClick={() => setPositionError(true)}>
                  <Icon type="error" size={18} color="#FF3672" />
               </button>
            }
         </div>

         <div
         className={`keyword_position absolute bg-[#f8f9ff] w-fit min-w-[50px] h-12 p-2 text-base mt-[-20px] rounded right-5 lg:relative
          lg:bg-transparent lg:w-auto lg:h-auto lg:mt-0 lg:p-0 lg:text-sm lg:flex-1 lg:basis-24 lg:grow-0 lg:right-0 text-center font-semibold`}>
            <KeywordPosition position={position} updating={updating} />
            {!updating && positionChange > 0 && <i className=' not-italic ml-1 text-xs text-[#5ed7c3]'>▲ {positionChange}</i>}
            {!updating && positionChange < 0 && <i className=' not-italic ml-1 text-xs text-red-300'>▼ {positionChange}</i>}
         </div>

         <div
         title={bestPosition && bestPosition.date
            ? new Date(bestPosition.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }) : ''
         }
         className={`keyword_best mr-1 bg-[#f8f9ff] float-right mt-8 w-14 rounded right-5 lg:relative lg:block
          lg:bg-transparent lg:w-auto lg:h-auto lg:mt-0 lg:mr-0 lg:p-0 lg:text-sm lg:flex-1 lg:basis-16 lg:grow-0 lg:right-0 text-center font-semibold
          ${!tableColumns.includes('Best') ? 'lg:hidden' : ''}
          `}>
            {bestPosition ? bestPosition.position || '-' : (position || '-')}
         </div>

         {chartData.labels.length > 0 && (
            <div
               className={`hidden basis-20 grow-0 cursor-pointer lg:block ${!tableColumns.includes('History') ? 'lg:hidden' : ''}`}
               onClick={() => showKeywordDetails()}>
               <ChartSlim labels={chartData.labels} sreies={chartData.sreies} />
            </div>
         )}

         <div
         className={`hidden bg-[#f8f9ff] w-fit min-w-[50px] h-12 p-2 text-base mt-[-20px] rounded right-5 lg:relative lg:block
          lg:bg-transparent lg:w-auto lg:h-auto lg:mt-0 lg:p-0 lg:text-sm lg:flex-1 lg:basis-24 lg:grow-0 lg:right-0 text-center
          ${!tableColumns.includes('Volume') ? 'lg:hidden' : ''}
          `}>
            {formattedNum(volume)}
         </div>

         <div
         className={`keyword_url inline-block mt-4 mr-5 ml-5 lg:flex-1 text-gray-400 lg:m-0 max-w-[70px] 
         overflow-hidden text-ellipsis whitespace-nowrap lg:max-w-none lg:pr-5 lg:pl-3`}>
            <a href={url} target="_blank" rel="noreferrer"><span className='mr-3 lg:hidden'>
               <Icon type="link-alt" size={14} color="#999" /></span>{turncatedURL || '-'}
            </a>
         </div>

         <div
         className='inline-block mt-[4] top-[-5px] relative lg:flex-1 lg:m-0 lg:top-0 max-w-[150px]'>
            <span className='mr-2 lg:hidden'><Icon type="clock" size={14} color="#999" /></span>
            <TimeAgo title={dayjs(lastUpdated).format('DD-MMM-YYYY, hh:mm:ss A')} date={lastUpdated} />
         </div>

         {showSCData && tableColumns.includes('Search Console') && (
            <div className='keyword_sc_data min-w-[170px] lg:max-w-[170px] text-xs mt-4 pt-2 border-t border-gray-100 top-[6px]
            relative flex justify-between text-center lg:flex-1 lg:text-sm lg:m-0 lg:mt-0 lg:border-t-0 lg:pt-0 lg:top-0'>
               <span className='min-w-[40px]'>
                  <span className='lg:hidden'>SC Position: </span>
                  <KeywordPosition
                  position={keywordData?.scData?.position[scDataType as keyof KeywordSCDataChild] || 0}
                  type='sc'
                  />
               </span>
               <span className='min-w-[40px]'>
                  <span className='lg:hidden'>Impressions: </span>{keywordData?.scData?.impressions[scDataType as keyof KeywordSCDataChild] || 0}
               </span>
               <span className='min-w-[40px]'>
                  <span className='lg:hidden'>Visits: </span>{keywordData?.scData?.visits[scDataType as keyof KeywordSCDataChild] || 0}
               </span>
               {/* <span>{keywordData?.scData?.ctr[scDataType] || '0.00%'}</span> */}
            </div>
         )}

         <div className='absolute right-4 mt-[-10px] top-2 lg:flex-1 lg:basis-5 lg:grow-0 lg:shrink-0 lg:relative lg:right-[-10px]'>
            <button
            className={`keyword_dots rounded px-1 text-indigo-300 hover:bg-indigo-50 ${showOptions ? 'bg-indigo-50 text-indigo-600 ' : ''}`}
            onClick={() => setShowOptions(!showOptions)}>
               <Icon type="dots" size={20} />
            </button>
            {showOptions && (
               <ul className='keyword_options customShadow absolute w-[180px] right-0 bg-white rounded border z-20'>
                  <li>
                     <a className={optionsButtonStyle} onClick={() => { refreshkeyword([ID]); setShowOptions(false); }}>
                     <span className=' bg-indigo-100 text-blue-700 px-1 rounded'><Icon type="reload" size={11} /></span> Refresh Keyword</a>
                  </li>
                  <li>
                     <a className={optionsButtonStyle}
                     onClick={() => { favoriteKeyword({ keywordID: ID, sticky: !sticky }); setShowOptions(false); }}>
                        <span className=' bg-yellow-300/30 text-yellow-500 px-1 rounded'>
                           <Icon type="star" size={14} />
                        </span> { sticky ? 'Unfavorite Keyword' : 'Favorite Keyword'}
                     </a>
                  </li>
                  <li><a className={optionsButtonStyle} onClick={() => { manageTags(); setShowOptions(false); }}>
                     <span className=' bg-green-100 text-green-500 px-1 rounded'><Icon type="tags" size={14} /></span> Add/Edit Tags</a>
                  </li>
                  <li><a className={optionsButtonStyle} onClick={() => { removeKeyword([ID]); setShowOptions(false); }}>
                     <span className=' bg-red-100 text-red-600 px-1 rounded'><Icon type="trash" size={14} /></span> Remove Keyword</a>
                  </li>
               </ul>
            )}
         </div>

         {lastUpdateError && lastUpdateError.date && showPositionError && (
            <div className={`absolute p-2 bg-white z-30 border border-red-200 rounded w-[220px] left-4 shadow-sm text-xs 
            ${index > 2 ? 'lg:bottom-12 mt-[-70px]' : ' top-12'}`}>
               Error Updating Keyword position (Tried <TimeAgo
                                                         title={dayjs(lastUpdateError.date).format('DD-MMM-YYYY, hh:mm:ss A')}
                                                         date={lastUpdateError.date} />)
               <i className='absolute top-0 right-0 ml-2 p-2 font-semibold not-italic cursor-pointer' onClick={() => setPositionError(false)}>
                  <Icon type="close" size={16} color="#999" />
               </i>
               <div className=' border-t-[1px] border-red-100 mt-2 pt-1'>
                  {lastUpdateError.scraper && <strong className='capitalize'>{lastUpdateError.scraper}: </strong>}{lastUpdateError.error}
               </div>
            </div>
         )}

      </div>
   );
 };

 export default Keyword;
