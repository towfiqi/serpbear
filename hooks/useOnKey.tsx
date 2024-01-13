import { useEffect } from 'react';

const useOnKey = (key:string, onPress: Function) => {
   useEffect(() => {
      const closeModalonEsc = (event:KeyboardEvent) => {
         if (event.key === key) {
            onPress();
         }
      };
      window.addEventListener('keydown', closeModalonEsc, false);
      return () => {
         window.removeEventListener('keydown', closeModalonEsc, false);
      };
   }, [key, onPress]);
};

export default useOnKey;
