import React, { useEffect, useState } from 'react';
import Icon from './Icon';
import useOnKey from '../../hooks/useOnKey';

type SidePanelProps = {
   children: React.ReactNode,
   closePanel: Function,
   title?: string,
   width?: 'large' | 'medium' | 'small',
   position?: 'left' | 'right'
}
const SidePanel = ({ children, closePanel, width, position = 'right', title = '' }:SidePanelProps) => {
   useOnKey('Escape', closePanel);
   const closeOnBGClick = (e:React.SyntheticEvent) => {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      if (e.target === e.currentTarget) { closePanel(); }
   };
   return (
       <div className="SidePanel fixed w-full h-screen top-0 left-0 z-50" onClick={closeOnBGClick}>
         <div className={`absolute w-full max-w-md  border-l border-l-gray-400 bg-white customShadow top-0 
         ${position === 'left' ? 'left-0' : 'right-0'} h-screen`}>
            <div className='SidePanel__header px-5 py-4 text-slate-500 border-b border-b-gray-100'>
               <h3 className=' text-black text-lg font-bold'>{title}</h3>
               <button
               className=' absolute top-2 right-2 p-2 px- text-gray-400 hover:text-gray-700 transition-all hover:rotate-90'
               onClick={() => closePanel()}>
                  <Icon type='close' size={24} />
               </button>
            </div>
            <div>{children}</div>
         </div>
       </div>
   );
};

export default SidePanel;
