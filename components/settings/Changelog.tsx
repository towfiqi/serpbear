import React, { useLayoutEffect, useMemo } from 'react';
import TimeAgo from 'react-timeago';
import dayjs from 'dayjs';
import SidePanel from '../common/SidePanel';
import { useFetchChangelog } from '../../services/misc';
import Icon from '../common/Icon';

const Markdown = React.lazy(() => import('react-markdown'));

type ChangeLogProps = {
   closeChangeLog: Function,
}

const ChangeLogloader = () => {
   return (
      <div className='w-full h-full absolute flex justify-center items-center'>
         <Icon type="loading" size={36} color='#999' />
      </div>
   );
};

const ChangeLog = ({ closeChangeLog }: ChangeLogProps) => {
   const { data: changeLogData, isLoading } = useFetchChangelog();

   useLayoutEffect(() => {
      document.body.style.overflow = 'hidden';
      // eslint-disable-next-line no-unused-expressions
      () => {
         console.log('run CleanUp !');
         document.body.style.overflow = 'auto';
       };
   }, []);

   const onClose = () => {
      document.body.style.overflow = 'auto';
      closeChangeLog();
   };

   const changeLogs = useMemo(() => {
      if (changeLogData && Array.isArray(changeLogData)) {
         return changeLogData.map(({ name = '', body, published_at }:{name: string, body: string, published_at: string}) => ({
            version: name,
            major: !!(name.match(/v\d+\.0+\.0/)),
            date: published_at,
            content: body.replaceAll(/^(##|###) \[([^\]]+)\]\(([^)]+)\) \(([^)]+)\)/g, '')
            .replaceAll(/\(\[(.*?)\]\((https:\/\/github\.com\/towfiqi\/serpbear\/commit\/([a-f0-9]{40}))\)\)/g, ''),
         }));
      }
      return [];
   }, [changeLogData]);

   return <SidePanel title='SerpBear Changelog' closePanel={onClose}>
            <React.Suspense fallback={<ChangeLogloader />}>
               {!isLoading && changeLogs.length > 0 && (
                  <div className='changelog-body bg-[#f8f9ff] px-6 pt-4 pb-10 overflow-y-auto styled-scrollbar'>
                     {changeLogs.map(({ version, content, date, major }) => {
                        return (
                           <div
                           key={version}
                           className={`domKeywords bg-white rounded mb-6 border ${major ? ' border-indigo-400' : 'border-transparent'}`}>
                              <h4 className=' px-5 py-3 border-b border-b-gray-100 flex justify-between text-indigo-700 font-semibold'>
                                 <a href={`https://github.com/towfiqi/serpbear/releases/tag/${version}`}>
                                    {version} {major && <span className=' text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded ml-2'>Major</span>}
                                 </a>
                                 <span className=' text-sm text-gray-500'>
                                    <TimeAgo title={dayjs(date).format('DD-MMM-YYYY, hh:mm:ss A')} date={date} />
                                 </span>
                              </h4>
                              <div className='changelog-content px-5 py-3 text-sm text-left'><Markdown>{content}</Markdown></div>
                           </div>
                        );
                     })}
                  </div>
               )}
               {isLoading && <ChangeLogloader />}
            </React.Suspense>
         </SidePanel>;
};

export default ChangeLog;
