import { useEffect, useState } from 'react';

const useIsMobile = () => {
   const [isMobile, setIsMobile] = useState<boolean>(false);
   useEffect(() => {
      setIsMobile(!!(window.matchMedia('only screen and (max-width: 760px)').matches));
   }, []);

   return [isMobile];
};

export default useIsMobile;
