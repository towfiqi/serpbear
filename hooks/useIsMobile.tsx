import { useEffect, useState } from 'react';

const useIsMobile = () => {
   const [isMobile, setIsMobile] = useState<boolean>(false);
   const [isClient, setIsClient] = useState<boolean>(false);

   useEffect(() => {
      // Mark that we're now on the client side
      setIsClient(true);

      // Check if we're on mobile
      const checkIsMobile = () => {
         setIsMobile(!!(window.matchMedia('only screen and (max-width: 760px)').matches));
      };

      // Initial check
      checkIsMobile();

      // Add listener for resize events
      const mediaQuery = window.matchMedia('only screen and (max-width: 760px)');
      mediaQuery.addEventListener('change', checkIsMobile);

      // Cleanup
      return () => {
         mediaQuery.removeEventListener('change', checkIsMobile);
      };
   }, []);

   // Return false during SSR to prevent hydration mismatch
   return [isClient ? isMobile : false];
};

export default useIsMobile;
