import { useEffect } from 'react';

const useWindowResize = (onResize: () => void) => {
   useEffect(() => {
      // Only run on client side
      if (typeof window !== 'undefined') {
         onResize();
         window.addEventListener('resize', onResize);
         return () => {
            window.removeEventListener('resize', onResize);
         };
      }
      return undefined;
   }, [onResize]);
};

export default useWindowResize;
