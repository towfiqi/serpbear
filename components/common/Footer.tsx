import { useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import { useFetchChangelog } from '../../services/misc';
import ChangeLog from '../settings/Changelog';

interface FooterProps {
   currentVersion: string
}

const Footer = ({ currentVersion = '' }: FooterProps) => {
   const [showChangelog, setShowChangelog] = useState(false);
   const { data: changeLogs } = useFetchChangelog();
   const latestVersionNum = changeLogs && Array.isArray(changeLogs) && changeLogs[0] ? changeLogs[0].name : '';

   return (
      <footer className='text-center flex flex-1 justify-center pb-5 items-end'>
         <span className='text-gray-500 text-xs'>
            <a className='cursor-pointer' onClick={() => setShowChangelog(true)}>SerpBear v{currentVersion || '0.0.0'}</a>
            {currentVersion && latestVersionNum && `v${currentVersion}` !== latestVersionNum && (
               <a className='cursor-pointer text-indigo-700 font-semibold' onClick={() => setShowChangelog(true)}>
                  {' '}| Update to Version {latestVersionNum} (latest)
               </a>
            )}
         </span>
         <CSSTransition in={showChangelog} timeout={300} classNames="settings_anim" unmountOnExit mountOnEnter>
             <ChangeLog closeChangeLog={() => setShowChangelog(false)} />
         </CSSTransition>
      </footer>
   );
};

export default Footer;
