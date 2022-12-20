/* eslint-disable @next/next/no-img-element */
// import { useRouter } from 'next/router';
// import { useState } from 'react';
import TimeAgo from 'react-timeago';
import dayjs from 'dayjs';
import Link from 'next/link';
import Icon from '../common/Icon';

type DomainItemProps = {
   domain: DomainType,
   selected: boolean,
   isConsoleIntegrated: boolean
}

const DomainItem = ({ domain, selected, isConsoleIntegrated = false }: DomainItemProps) => {
   const { keywordsUpdated, slug, keywordCount = 0, avgPosition = 0, scVisits = 0, scImpressions = 0, scPosition = 0 } = domain;
   // const router = useRouter();
   return (
      <div className={`domItem bg-white border rounded w-full text-sm mb-10 hover:border-indigo-200 ${selected ? '' : ''}`}>
         <Link href={`/domain/${slug}`} passHref={true}>
         <a className='flex flex-col lg:flex-row'>
            <div className={`flex-1 p-6 flex ${!isConsoleIntegrated ? 'basis-1/3' : ''}`}>
               <div className="domain_thumb w-20 h-20 mr-6 bg-slate-100 rounded border border-gray-200 overflow-hidden">
                  <img src={`https://image.thum.io/get/maxAge/96/width/200/https://${domain.domain}`} alt={domain.domain} />
               </div>
               <div className="domain_details flex-1">
                  <h3 className='font-semibold text-base mb-2 capitalize'>{domain.domain}</h3>
                 {keywordsUpdated && (
                  <span className=' text-gray-600 text-xs'>
                     Updated <TimeAgo title={dayjs(keywordsUpdated).format('DD-MMM-YYYY, hh:mm:ss A')} date={keywordsUpdated} />
                  </span>
                 )}
               </div>
            </div>
            <div className='flex-1 flex flex-col p-4'>
               <div className=' bg-indigo-50 p-1 px-2 text-xs rounded-full absolute ml-3 mt-[-8px]'>
                  <Icon type="tracking" size={13} color="#364aff" /> Tracker
               </div>
               <div className='dom_stats flex flex-1 font-semibold text-2xl p-4 pt-5 rounded border border-[#E9EBFF] text-center'>
                  <div className="flex-1 relative">
                     <span className='block text-xs lg:text-sm text-gray-500 mb-1'>Keywords</span>{keywordCount}
                  </div>
                  <div className="flex-1 relative">
                     <span className='block text-xs lg:text-sm text-gray-500 mb-1'>Avg position</span>{avgPosition}
                  </div>
               </div>
            </div>
            {isConsoleIntegrated && (
               <div className='flex-1 flex-col p-4 lg:basis-56'>
                  <div className=' bg-indigo-50 p-1 px-2 text-xs rounded-full absolute ml-3 mt-[-8px]'>
                     <Icon type="google" size={13} /> Search Console (7d)
                  </div>
                  <div className='dom_sc_stats flex flex-1 h-full font-semibold text-2xl p-4 pt-5 rounded border border-[#E9EBFF] text-center'>
                     <div className="flex-1 relative">
                        <span className='block text-xs lg:text-sm text-gray-500 mb-1'>Visits</span>
                        {new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(scVisits).replace('T', 'K')}
                     </div>
                     <div className="flex-1 relative">
                        <span className='block text-xs lg:text-sm text-gray-500 mb-1'>Impressions</span>
                        {new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(scImpressions).replace('T', 'K')}
                     </div>
                     <div className="flex-1 relative">
                        <span className='block text-xs lg:text-sm text-gray-500 mb-1'>Avg position</span>
                        {scPosition}
                     </div>
                  </div>
               </div>
            )}
         </a>
         </Link>
      </div>
   );
};

export default DomainItem;
