import { useState } from 'react';
import Icon from './Icon';

type SecretFieldProps = {
   label: string;
   value: string;
   onChange: Function;
   placeholder?: string;
   classNames?: string;
   hasError?: boolean;
}

const SecretField = ({ label = '', value = '', placeholder = '', onChange, hasError = false }: SecretFieldProps) => {
   const [showValue, setShowValue] = useState(false);
   const labelStyle = 'mb-2 font-semibold inline-block text-sm text-gray-700 capitalize';
   return (
      <div className="settings__section__secret mb-5 relative">
         <label className={labelStyle}>{label}</label>
         <span
         className="absolute top-8 right-0 px-2 py-1 cursor-pointer text-gray-400 select-none"
         onClick={() => setShowValue(!showValue)}>
            <Icon type={showValue ? 'eye-closed' : 'eye'} size={18} />
         </span>
         <input
            className={`w-full p-2 border border-gray-200 rounded mb-3 focus:outline-none 
             focus:border-blue-200 ${hasError ? ' border-red-400 focus:border-red-400' : ''} `}
            type={showValue ? 'text' : 'password'}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            autoComplete="off"
            placeholder={placeholder}
         />
      </div>
   );
};

export default SecretField;
