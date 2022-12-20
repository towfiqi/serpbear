import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link';
import { useRefreshKeywords } from '../../services/keywords';
import Icon from '../common/Icon';
import SelectField from '../common/SelectField';

type DomainHeaderProps = {
   domain: DomainType,
   domains: DomainType[],
   showAddModal: Function,
   showSettingsModal: Function,
   exportCsv:Function,
   scFilter?: string
   setScFilter?: Function
}

const DomainHeader = ({ domain, showAddModal, showSettingsModal, exportCsv, domains, scFilter = 'thirtyDays', setScFilter }: DomainHeaderProps) => {
   const router = useRouter();
   const [showOptions, setShowOptions] = useState<boolean>(false);
   const [ShowSCDates, setShowSCDates] = useState<boolean>(false);
   const { mutate: refreshMutate } = useRefreshKeywords(() => {});
   const isConsole = router.pathname === '/domain/console/[slug]';
   const isInsight = router.pathname === '/domain/insight/[slug]';

   const daysName = (dayKey:string) => dayKey.replace('three', '3').replace('seven', '7').replace('thirty', '30').replace('Days', ' Days');
   const buttonStyle = 'leading-6 inline-block px-2 py-2 text-gray-500 hover:text-gray-700';
   const buttonLabelStyle = 'ml-2 text-sm not-italic lg:invisible lg:opacity-0';
   const tabStyle = 'rounded rounded-b-none cursor-pointer border-[#e9ebff] border-b-0';
   const scDataFilterStlye = 'px-3 py-2 block w-full';
   return (
      <div className='domain_kewywords_head w-full '>
         <div>
            <h1 className="hidden lg:block text-xl font-bold my-3" data-testid="domain-header">
               {domain && domain.domain && <><i className=' capitalize font-bold not-italic'>{domain.domain.charAt(0)}</i>{domain.domain.slice(1)}</>}
            </h1>
            <div className='domain_selector bg-white mt-2 lg:hidden'>
               <SelectField
               options={domains && domains.length > 0 ? domains.map((d) => { return { label: d.domain, value: d.slug }; }) : []}
               selected={[domain.slug]}
               defaultLabel="Select Domain"
               updateField={(updateSlug:[string]) => updateSlug && updateSlug[0] && router.push(`${updateSlug[0]}`)}
               multiple={false}
               rounded={'rounded'}
               />
            </div>
         </div>
      <div className='flex w-full justify-between'>
         <ul className=' flex items-end text-sm relative top-[2px]'>
            <li className={`${tabStyle} ${router.pathname === '/domain/[slug]' ? 'bg-white border border-b-0 font-semibold' : ''}`}>
               <Link href={`/domain/${domain.slug}`} passHref={true}>
                  <a className='px-4 py-2 inline-block'><Icon type="tracking" color='#999' classes='hidden lg:inline-block' />
                     <span className='text-xs lg:text-sm lg:ml-2'>Tracking</span>
                  </a>
               </Link>
            </li>
            <li className={`${tabStyle} ${router.pathname === '/domain/console/[slug]' ? 'bg-white border border-b-0 font-semibold' : ''}`}>
               <Link href={`/domain/console/${domain.slug}`} passHref={true}>
                  <a className='px-4 py-2 inline-block'><Icon type="google" size={13} classes='hidden lg:inline-block' />
                     <span className='text-xs lg:text-sm lg:ml-2'>Discover</span>
                     <Icon type='help' size={14} color="#aaa" classes="ml-2 hidden lg:inline-block" title='Discover Keywords you already Rank For' />
                  </a>
               </Link>
            </li>
            <li className={`${tabStyle} ${router.pathname === '/domain/insight/[slug]' ? 'bg-white border border-b-0 font-semibold' : ''}`}>
               <Link href={`/domain/insight/${domain.slug}`} passHref={true}>
                  <a className='px-4 py-2 inline-block'><Icon type="google" size={13} classes='hidden lg:inline-block' />
                     <span className='text-xs lg:text-sm lg:ml-2'>Insight</span>
                     <Icon type='help' size={14} color="#aaa" classes="ml-2 hidden lg:inline-block" title='Insight for Google Search Console Data' />
                  </a>
               </Link>
            </li>
         </ul>
         <div className={'flex mt-3 mb-0 lg:mb-3'}>
            {!isInsight && <button className={`${buttonStyle} lg:hidden`} onClick={() => setShowOptions(!showOptions)}>
               <Icon type='dots' size={20} />
            </button>
            }
            {isInsight && <button className={`${buttonStyle} lg:hidden invisible`}>x</button>}
            <div
            className={`hidden w-40 ml-[-70px] lg:block absolute mt-10 bg-white border border-gray-100 z-40 rounded 
            lg:z-auto lg:relative lg:mt-0 lg:border-0 lg:w-auto lg:bg-transparent`}
            style={{ display: showOptions ? 'block' : undefined }}>
               {!isInsight && (
                  <button
                  className={`domheader_action_button relative ${buttonStyle}`}
                  aria-pressed="false"
                  onClick={() => exportCsv()}>
                     <Icon type='download' size={20} /><i className={`${buttonLabelStyle}`}>Export as csv</i>
                  </button>
               )}
               {!isConsole && !isInsight && (
                  <button
                  className={`domheader_action_button relative ${buttonStyle} lg:ml-3`}
                  aria-pressed="false"
                  onClick={() => refreshMutate({ ids: [], domain: domain.domain })}>
                     <Icon type='reload' size={14} /><i className={`${buttonLabelStyle}`}>Reload All Serps</i>
                  </button>
                )}
               <button
               data-testid="show_domain_settings"
               className={`domheader_action_button relative ${buttonStyle} lg:ml-3`}
               aria-pressed="false"
               onClick={() => showSettingsModal(true)}><Icon type='settings' size={20} />
                  <i className={`${buttonLabelStyle}`}>Domain Settings</i>
               </button>
            </div>
            {!isConsole && !isInsight && (
               <button
               data-testid="add_keyword"
               className={'ml-2 inline-block px-4 py-2 text-blue-700 font-bold text-sm'}
               onClick={() => showAddModal(true)}>
                  <span
                  className='text-center leading-4 mr-2 inline-block rounded-full w-7 h-7 pt-1 bg-blue-700 text-white font-bold text-lg'>+</span>
                  <i className=' not-italic hidden lg:inline-block'>Add Keyword</i>
               </button>
            )}
            {isConsole && (
               <div className='text-xs pl-4 ml-2 border-l border-gray-200 relative'>
                  {/* <span className='hidden lg:inline-block'>Data From Last: </span> */}
                  <span className='block cursor-pointer py-3' onClick={() => setShowSCDates(!ShowSCDates)}>
                     <Icon type='date' size={13} classes="mr-1" /> {daysName(scFilter)}
                  </span>
                  {ShowSCDates && (
                     <div className='absolute w-24 z-50 mt-0 right-0 bg-white border border-gray-200 rounded text-center'>
                        {['threeDays', 'sevenDays', 'thirtyDays'].map((itemKey) => {
                           return <button
                                    key={itemKey}
                                    className={`${scDataFilterStlye} ${scFilter === itemKey ? ' bg-indigo-100 text-indigo-600' : ''}`}
                                    onClick={() => { setShowSCDates(false); if (setScFilter) setScFilter(itemKey); }}
                                    >Last {daysName(itemKey)}
                                 </button>;
                        })}
                     </div>
                  )}
               </div>
            )}
         </div>
      </div>
      </div>
   );
};

export default DomainHeader;
