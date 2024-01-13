import React from 'react';
import countries from '../../utils/countries';
import Icon from '../common/Icon';
import { formattedNum } from '../../utils/client/helpers';

type InsightItemProps = {
   item: SCInsightItem,
   lastItem: boolean,
   type: string,
   domain: string
}

const InsightItem = ({ item, lastItem, type, domain }:InsightItemProps) => {
   const { clicks, impressions, ctr, position, country = 'zzz', keyword, page, keywords = 0, countries: cntrs = 0, date } = item;
   let firstItem = keyword;
   if (type === 'pages') { firstItem = page; } if (type === 'stats') {
      firstItem = date && new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(date));
   }
   if (type === 'countries') { firstItem = countries[country] && countries[country][0]; }

   return (
      <div
      className={`keyword relative py-5 px-4 text-gray-600 border-b-[1px] border-gray-200 lg:py-4 lg:px-6 lg:border-0 
      lg:flex lg:justify-between lg:items-center ${lastItem ? 'border-b-0' : ''}`}>

         <div className=' w-3/4 lg:flex-1 lg:basis-20 lg:w-auto font-semibold'>
            {type === 'countries' && <span className={`fflag fflag-${country} w-[18px] h-[12px] mr-2`} />}
            {type === 'pages' && domain ? <a href={`https://${domain}${page}`} target='_blank' rel="noreferrer">{firstItem}</a> : firstItem}
         </div>

         <div className='keyword_pos text-center inline-block mr-3 lg:mr-0 lg:flex-1'>
            <span className='mr-1 lg:hidden'>
               <Icon type="tracking" size={14} color="#999" />
            </span>
            {Math.round(position)}
         </div>

         <div className={`keyword_position absolute bg-[#f8f9ff] w-fit min-w-[50px] h-14 p-2 text-base mt-[-55px] rounded right-5 lg:relative
          lg:bg-transparent lg:w-auto lg:h-auto lg:mt-0 lg:p-0 lg:text-sm lg:flex-1 lg:basis-40 lg:grow-0 lg:right-0 text-center font-semibold`}>
            {formattedNum(clicks)}
            <span className='block text-xs text-gray-500 lg:hidden'>Visits</span>
         </div>

         <div className='keyword_imp text-center inline-block mr-3 lg:mr-0 lg:flex-1'>
            <span className='mr-1 lg:hidden'>
               <Icon type="eye" size={14} color="#999" />
            </span>
            {formattedNum(impressions)}
         </div>

         <div className='keyword_ctr text-center inline-block mt-4 relative mr-3 lg:mr-0 lg:flex-1 lg:m-0 '>
            <span className='mr-1 lg:hidden'>
               <Icon type="target" size={14} color="#999" />
            </span>
            {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(ctr)}%
         </div>

         {(type === 'pages' || type === 'keywords') && (
            <div className='keyword_imp text-center hidden lg:inline-block lg:flex-1'>{formattedNum(cntrs)}</div>
         )}

         {(type === 'countries' || type === 'pages') && (
            <div className='keyword_imp text-center hidden lg:inline-block lg:flex-1'>{formattedNum(keywords)}</div>
         )}
      </div>
   );
};

export default InsightItem;
