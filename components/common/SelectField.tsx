import React, { useMemo, useState } from 'react';
import Icon from './Icon';

export type SelectionOption = {
   label:string,
   value: string
}
type SelectFieldProps = {
   defaultLabel: string,
   options: SelectionOption[],
   selected: string[],
   multiple?: boolean,
   updateField: Function,
   minWidth?: number,
   maxHeight?: number|string,
   rounded?: string,
   flags?: boolean,
   emptyMsg?: string
}
const SelectField = (props: SelectFieldProps) => {
   const {
      options,
      selected,
      defaultLabel = 'Select an Option',
      multiple = true,
      updateField,
      minWidth = 180,
      maxHeight = 96,
      rounded = 'rounded-3xl',
      flags = false,
      emptyMsg = '' } = props;

   const [showOptions, setShowOptions] = useState<boolean>(false);
   const [filterInput, setFilterInput] = useState<string>('');
   const [filterdOptions, setFilterdOptions] = useState<SelectionOption[]>([]);

   const selectedLabels = useMemo(() => {
      return options.reduce((acc:string[], item:SelectionOption) :string[] => {
         return selected.includes(item.value) ? [...acc, item.label] : [...acc];
     }, []);
   }, [selected, options]);

   const selectItem = (option:SelectionOption) => {
      let updatedSelect = [option.value];
      if (multiple && Array.isArray(selected)) {
         if (selected.includes(option.value)) {
            updatedSelect = selected.filter((x) => x !== option.value);
         } else {
            updatedSelect = [...selected, option.value];
         }
      }
      updateField(updatedSelect);
      if (!multiple) { setShowOptions(false); }
   };

   const filterOptions = (event:React.FormEvent<HTMLInputElement>) => {
      setFilterInput(event.currentTarget.value);
      const filteredItems:SelectionOption[] = [];
      const userVal = event.currentTarget.value.toLowerCase();
      options.forEach((option:SelectionOption) => {
         if (flags ? option.label.toLowerCase().startsWith(userVal) : option.label.toLowerCase().includes(userVal)) {
            filteredItems.push(option);
         }
      });
      setFilterdOptions(filteredItems);
   };

   return (
       <div className="select font-semibold text-gray-500">
         <div
         className={`selected flex border ${rounded} p-1.5 px-4 cursor-pointer select-none w-[180px] min-w-[${minWidth}px] 
         ${showOptions ? 'border-indigo-200' : ''}`}
         onClick={() => setShowOptions(!showOptions)}>
            <span className={`w-[${minWidth - 30}px] inline-block truncate mr-2 capitalize`}>
               {selected.length > 0 ? (selectedLabels.slice(0, 2).join(', ')) : defaultLabel}
            </span>
            {multiple && selected.length > 2
            && <span className={`px-2 py-0 ${rounded} bg-[#eaecff] text-[0.7rem] font-bold`}>{(selected.length)}</span>}
            <span className='ml-2'><Icon type={showOptions ? 'caret-up' : 'caret-down'} size={9} /></span>
         </div>
         {showOptions && (
            <div
            className={`select_list mt-1 border absolute min-w-[${minWidth}px] 
            ${rounded === 'rounded-3xl' ? 'rounded-lg' : rounded} max-h-${maxHeight} bg-white z-50 overflow-y-auto styled-scrollbar`}>
               {options.length > 20 && (
                  <div className=''>
                     <input
                     className=' border-b-[1px] p-3 w-full focus:outline-0 focus:border-blue-100'
                     type="text"
                     placeholder='Search..'
                     onChange={filterOptions}
                     value={filterInput}
                     />
                  </div>
               )}
               <ul>
                  {(options.length > 20 && filterdOptions.length > 0 && filterInput ? filterdOptions : options).map((opt) => {
                     const itemActive = selected.includes(opt.value);
                     return (
                        <li
                        key={opt.value}
                        className={`select-none cursor-pointer px-3 py-2 hover:bg-[#FCFCFF] capitalize
                        ${itemActive ? ' bg-indigo-50 text-indigo-600 hover:bg-indigo-50' : ''} `}
                        onClick={() => selectItem(opt)}
                        >
                           {multiple && (
                              <span
                                 className={`p-0 mr-2 leading-[0px] inline-block rounded-sm pt-0 px-[1px] pb-[3px] border
                                 ${itemActive ? ' bg-indigo-600 border-indigo-600 text-white' : 'text-transparent'}`} >
                                 <Icon type="check" size={10} />
                              </span>
                           )}
                           {flags && <span className={`fflag fflag-${opt.value} w-[15px] h-[10px] mr-1`} />}
                           {opt.label}
                        </li>
                     );
                  })}
               </ul>
               {emptyMsg && options.length === 0 && <p className='p-4'>{emptyMsg}</p>}
            </div>
         )}
       </div>
   );
 };

 export default SelectField;
