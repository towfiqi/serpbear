type ToggleFieldProps = {
   label: string;
   value: boolean;
   onChange: (bool:boolean) => void ;
   classNames?: string;
}

const ToggleField = ({ label = '', value = false, onChange, classNames = '' }: ToggleFieldProps) => {
   return (
      <div className={`field--toggle w-full relative ${classNames}`}>
         <label className="relative inline-flex items-center cursor-pointer w-full justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-300 w-auto">{label}</span>
            <input
            type="checkbox"
            value={value.toString()}
            checked={!!value}
            className="sr-only peer"
            onChange={() => onChange(!value)}
            />
            <div className="relative rounded-3xl w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4
            peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800rounded-full peer dark:bg-gray-700
            peer-checked:after:translate-x-full peer-checked:after:border-white after:content-['']
            after:absolute after:top-[2px] after:left-[2px] after:bg-white  after:border-gray-300
            after:border after:rounded-full after:h-4 after:w-4
            after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>

         </label>
      </div>
   );
};

export default ToggleField;
