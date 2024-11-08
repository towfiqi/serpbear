import React, { useMemo } from 'react';
import Icon from '../common/Icon';
import countries from '../../utils/countries';
import { formattedNum } from '../../utils/client/helpers';
import ChartSlim from '../common/ChartSlim';

type KeywordIdeaProps = {
   keywordData: IdeaKeyword,
   selected: boolean,
   lastItem?:boolean,
   isFavorite: boolean,
   style: Object,
   selectKeyword: Function,
   favoriteKeyword:Function,
   showKeywordDetails: Function
}

const KeywordIdea = (props: KeywordIdeaProps) => {
   const { keywordData, selected, lastItem, selectKeyword, style, isFavorite = false, favoriteKeyword, showKeywordDetails } = props;
   const { keyword, uid, position, country, monthlySearchVolumes, avgMonthlySearches, competition, competitionIndex } = keywordData;

   const chartData = useMemo(() => {
      const chartDataObj: { labels: string[], sreies: number[] } = { labels: [], sreies: [] };
      Object.keys(monthlySearchVolumes).forEach((dateKey:string) => {
         chartDataObj.labels.push(dateKey);
         chartDataObj.sreies.push(parseInt(monthlySearchVolumes[dateKey], 10));
      });
      return chartDataObj;
   }, [monthlySearchVolumes]);

   return (
      <div
      key={keyword}
      style={style}
      className={`keyword relative py-5 px-4 text-gray-600 border-b-[1px] border-gray-200 lg:py-4 lg:px-6 lg:border-0 
      lg:flex lg:justify-between lg:items-center ${selected ? ' bg-indigo-50 keyword--selected' : ''} ${lastItem ? 'border-b-0' : ''}`}>

         <div className=' w-3/4 lg:flex-1 lg:basis-20 lg:w-auto font-semibold cursor-pointer'>
            <button
               className={`p-0 mr-2 leading-[0px] inline-block rounded-sm pt-0 px-[1px] pb-[3px] border 
               ${selected ? ' bg-blue-700 border-blue-700 text-white' : 'text-transparent'}`}
               onClick={() => selectKeyword(uid)}
               >
                  <Icon type="check" size={10} />
            </button>
            <a className='py-2 hover:text-blue-600' onClick={() => showKeywordDetails()}>
               <span className={`fflag fflag-${country} w-[18px] h-[12px] mr-2`} title={countries[country] && countries[country][0]} />{keyword}
            </a>
            <button
            className={`ml-2 hover:text-yellow-600 hover:opacity-100 ${isFavorite ? 'text-yellow-600' : ' opacity-50'}`}
            onClick={() => favoriteKeyword()}>
               <Icon type={isFavorite ? 'star-filled' : 'star'} classes='top-[4px]' size={18} />
            </button>
         </div>

         <div className='keyword_imp text-center inline-block ml-6 lg:ml-0 lg:flex-1 '>
            {formattedNum(avgMonthlySearches)}<span className='lg:hidden'>/month</span>
         </div>

         <div
          onClick={() => showKeywordDetails()}
         className={`keyword_visits text-center hidden mt-4 mr-5 ml-5 cursor-pointer
         lg:flex-1 lg:m-0 lg:ml-10 max-w-[70px] lg:max-w-none lg:pr-5 lg:flex justify-center`}>
            {chartData.labels.length > 0 && <ChartSlim labels={chartData.labels} sreies={chartData.sreies} noMaxLimit={true} reverse={false} />}
         </div>

         <div className='keyword_ctr text-center inline-block ml-4 lg:flex mt-4 relative lg:flex-1 lg:m-0 justify-center'>
            <div className={`idea_competiton idea_competiton--${competition} flex bg-slate-100 rounded w-28 text-xs font-semibold`}>
               <span className=' inline-block p-1 flex-1'>{competitionIndex}/100</span>
               <span className=' inline-block p-1 flex-1 rounded-e text-white'>{competition}</span>
            </div>
         </div>
      </div>
   );
 };

 export default KeywordIdea;
