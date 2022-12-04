import { useRouter } from 'next/router';
import { useState } from 'react';
import { useRefreshKeywords } from '../../services/keywords';
import Icon from '../common/Icon';
import SelectField from '../common/SelectField';

type DomainHeaderProps = {
   domain: Domain,
   domains: Domain[],
   showAddModal: Function,
   showSettingsModal: Function,
   exportCsv:Function
}

const DomainHeader = ({ domain, showAddModal, showSettingsModal, exportCsv, domains }: DomainHeaderProps) => {
   const router = useRouter();
   const [showOptions, setShowOptions] = useState<boolean>(false);

   const { mutate: refreshMutate } = useRefreshKeywords(() => {});

   const buttonStyle = 'leading-6 inline-block px-2 py-2 text-gray-500 hover:text-gray-700';
   const buttonLabelStyle = 'ml-2 text-sm not-italic lg:invisible lg:opacity-0';
   return (
      <div className='domain_kewywords_head flex w-full justify-between'>
         <div>
            <h1 className="hidden lg:block text-xl font-bold my-3" data-testid="domain-header">
               {domain && domain.domain && <><i className=' capitalize font-bold not-italic'>{domain.domain.charAt(0)}</i>{domain.domain.slice(1)}</>}
            </h1>
            <div className='bg-white mt-2 lg:hidden'>
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
         <div className='flex my-3'>
            <button className={`${buttonStyle} lg:hidden`} onClick={() => setShowOptions(!showOptions)}>
               <Icon type='dots' size={20} />
            </button>
            <div
            className={`hidden w-40 ml-[-70px] lg:block absolute mt-10 bg-white border border-gray-100 z-40 rounded 
            lg:z-auto lg:relative lg:mt-0 lg:border-0 lg:w-auto lg:bg-transparent`}
            style={{ display: showOptions ? 'block' : undefined }}>
               <button
               className={`domheader_action_button relative ${buttonStyle}`}
               aria-pressed="false"
               onClick={() => exportCsv()}>
                  <Icon type='download' size={20} /><i className={`${buttonLabelStyle}`}>Export as csv</i>
               </button>
               <button
               className={`domheader_action_button relative ${buttonStyle} lg:ml-3`}
               aria-pressed="false"
               onClick={() => refreshMutate({ ids: [], domain: domain.domain })}>
                  <Icon type='reload' size={14} /><i className={`${buttonLabelStyle}`}>Reload All Serps</i>
               </button>
               <button
               data-testid="show_domain_settings"
               className={`domheader_action_button relative ${buttonStyle} lg:ml-3`}
               aria-pressed="false"
               onClick={() => showSettingsModal(true)}><Icon type='settings' size={20} />
               <i className={`${buttonLabelStyle}`}>Domain Settings</i></button>
            </div>
            <button
            data-testid="add_keyword"
            className={'ml-2 inline-block px-4 py-2 text-blue-700 font-bold text-sm'}
            onClick={() => showAddModal(true)}>
               <span
               className='text-center leading-4 mr-2 inline-block rounded-full w-7 h-7 pt-1 bg-blue-700 text-white font-bold text-lg'>+</span>
               <i className=' not-italic hidden lg:inline-block'>Add Keyword</i>
            </button>
         </div>
      </div>
   );
};

export default DomainHeader;
