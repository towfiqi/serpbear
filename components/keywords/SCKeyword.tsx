import React from 'react';
import Icon from '../common/Icon';
import countries from '../../utils/countries';

type SCKeywordProps = {
   keywordData: SearchAnalyticsItem,
   selected: boolean,
   selectKeyword: Function,
   lastItem?:boolean,
   isTracked: boolean,
   style: Object
}

const SCKeyword = (props: SCKeywordProps) => {
   const { keywordData, selected, lastItem, selectKeyword, style, isTracked = false } = props;
   const { keyword, uid, position, country, impressions, ctr, clicks } = keywordData;

   const renderPosition = () => {
      if (position === 0) {
         return <span className='text-gray-400' title='Not in Top 100'>{'>100'}</span>;
      }
      return Math.round(position);
   };

   return (
      <div
      key={keyword}
      style={style}
      className={`keyword relative py-5 px-4 text-gray-600 border-b-[1px] border-gray-200 lg:py-4 lg:px-6 lg:border-0 
      lg:flex lg:justify-between lg:items-center ${selected ? ' bg-indigo-50 keyword--selected' : ''} ${lastItem ? 'border-b-0' : ''}`}>

         <div className=' w-3/4 lg:flex-1 lg:basis-20 lg:w-auto font-semibold cursor-pointer'>
            <button
               className={`p-0 mr-2 leading-[0px] inline-block rounded-sm pt-0 px-[1px] pb-[3px] border 
               ${isTracked || selected ? ' bg-blue-700 border-blue-700 text-white' : 'text-transparent'}
               ${isTracked ? 'bg-gray-400 border-gray-400 cursor-default' : ''}`}
               onClick={() => !isTracked && selectKeyword(uid)}
               >
                  <Icon type="check" size={10} title={isTracked ? 'Already in Tracker' : ''} />
            </button>
            <a className='py-2 hover:text-blue-600'>
               <span className={`fflag fflag-${country} w-[18px] h-[12px] mr-2`} title={countries[country] && countries[country][0]} />{keyword}
            </a>
         </div>

         <div className={`keyword_position absolute bg-[#f8f9ff] w-fit min-w-[50px] h-15 p-2 text-base mt-[-20px] rounded right-5 lg:relative
          lg:bg-transparent lg:w-auto lg:h-auto lg:mt-0 lg:p-0 lg:text-sm lg:flex-1 lg:basis-40 lg:grow-0 lg:right-0 text-center font-semibold`}>
            {renderPosition()}
            <span className='block text-xs text-gray-500 lg:hidden'>Position</span>
         </div>

         <div className='keyword_imp text-center inline-block lg:flex-1 '>
            <span className='mr-3 lg:hidden'>
               <Icon type="eye" size={14} color="#999" />
            </span>
            {new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3 }).format(impressions)}
         </div>

         <div className={'keyword_visits text-center inline-block mt-4 mr-5 ml-5 lg:flex-1 lg:m-0 max-w-[70px] lg:max-w-none lg:pr-5'}>
            <span className='mr-3 lg:hidden'>
               <Icon type="cursor" size={14} color="#999" />
            </span>
            {new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3 }).format(clicks)}
         </div>

         <div className='keyword_ctr text-center inline-block mt-4 relative lg:flex-1 lg:m-0 '>
            <span className='mr-3 lg:hidden'>
               <Icon type="target" size={14} color="#999" />
            </span>
            {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(ctr)}%
         </div>

      </div>
   );
 };

 export default SCKeyword;
