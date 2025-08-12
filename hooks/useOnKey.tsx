import { useEffect } from 'react';

const useOnKey = (key:string, onPress: Function) => {
   useEffect(() => {
      // Only run on client side
      if (typeof window !== 'undefined') {
         const closeModalonEsc = (event:KeyboardEvent) => {
            if (event.key === key) {
               onPress();
            }
         };
         window.addEventListener('keydown', closeModalonEsc, false);
         return () => {
            window.removeEventListener('keydown', closeModalonEsc, false);
         };
      }
      return undefined;
   }, [key, onPress]);
};

export default useOnKey;
