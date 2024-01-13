import { useEffect } from 'react';

const useWindowResize = (onResize: () => void) => {
   useEffect(() => {
      onResize();
      window.addEventListener('resize', onResize);
      return () => {
          window.removeEventListener('resize', onResize);
      };
   }, [onResize]);
};

export default useWindowResize;
