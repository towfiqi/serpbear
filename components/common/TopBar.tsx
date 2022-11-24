import { useRouter } from 'next/router';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Icon from './Icon';

type TopbarProps = {
   showSettings: Function
}

const TopBar = ({ showSettings }:TopbarProps) => {
   const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
   const router = useRouter();

   const logoutUser = async () => {
      try {
         const fetchOpts = { method: 'POST', headers: new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' }) };
         const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/logout`, fetchOpts).then((result) => result.json());
         console.log(res);
         if (!res.success) {
            toast(res.error, { icon: '⚠️' });
         } else {
            router.push('/login');
         }
      } catch (fetchError) {
         toast('Could not login, Ther Server is not responsive.', { icon: '⚠️' });
      }
   };

   return (
       <div className="topbar flex w-full max-w-7xl mx-auto justify-between lg:justify-end bg-white lg:bg-transparent">

         <h3 className="p-4 text-base font-bold text-blue-700 lg:hidden">
            <span className=' relative top-[3px] mr-1'><Icon type="logo" size={24} color="#364AFF" /></span> SerpBear
         </h3>
         <div className="topbar__right">
            <button className={' lg:hidden p-3'} onClick={() => setShowMobileMenu(!showMobileMenu)}>
               <Icon type="hamburger" size={24} />
            </button>
            <ul
            className={`text-sm font-semibold text-gray-500 absolute mt-[-10px] right-3 bg-white 
            border border-gray-200 lg:mt-2 lg:relative lg:block lg:border-0 lg:bg-transparent ${showMobileMenu ? 'block' : 'hidden'}`}>
               <li className='block lg:inline-block lg:ml-5'>
                  <a className='block px-3 py-2 cursor-pointer' href='https://serpbear.com/documentation' target="_blank" rel='noreferrer'>
                     <Icon type="question" color={'#888'} size={14} /> Help
                  </a>
               </li>
               <li className='block lg:inline-block lg:ml-5'>
                  <a className='block px-3 py-2 cursor-pointer' onClick={() => showSettings()}>
                     <Icon type="settings-alt" color={'#888'} size={14} /> Settings
                  </a>
               </li>
               <li className='block lg:inline-block lg:ml-5'>
                  <a className='block px-3 py-2 cursor-pointer' onClick={() => logoutUser()}>
                     <Icon type="logout" color={'#888'} size={14} /> Logout
                  </a>
               </li>
            </ul>
         </div>
       </div>
   );
 };

 export default TopBar;
