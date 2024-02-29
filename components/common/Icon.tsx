/* eslint-disable max-len */
import React from 'react';

type IconProps = {
   type: string;
   size?: number;
   color?: string;
   title?: string;
   classes?: string;
}

const Icon = ({ type, color = 'currentColor', size = 16, title = '', classes = '' }: IconProps) => {
   const xmlnsProps = { xmlns: 'http://www.w3.org/2000/svg', xmlnsXlink: 'http://www.w3.org/1999/xlink', preserveAspectRatio: 'xMidYMid meet' };

   return (
       <span className={`icon inline-block relative top-[2px] ${classes}`} title={title}>
         {type === 'logo'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 1484.32 1348.5">
               <path fill={color} d="M1406.23,604.17s-44-158.18,40.43-192.67,195,97.52,195,97.52,314-65.41,534,0c0,0,122.16-105.61,214.68-80.28,99.9,27.36,32.7,181.38,32.7,181.38s228.36,384.15,239.06,737.38c0,0-346.1,346.09-746.9,406.75,0,0-527.47-106.44-737.38-449.57C1177.88,1304.68,1169.55,1008.54,1406.23,604.17Z" transform="translate(-1177.84 -405.75)"/>
               <path fill='white' d="M1920.79,873S1659,855,1635,1275c0,0-19,182,304.82,178.35,244-2.75,260.55-118.61,266.41-182C2212,1209,2131,874,1920.79,873Z" transform="translate(-1177.84 -405.75)"/>
               <path fill={color} d="M1930.07,1194.67s143.91,5.95,116.55,94-118.93,83.25-118.93,83.25-96.34,0-134.4-95.15C1764.45,1204.62,1930.07,1194.67,1930.07,1194.67Z" transform="translate(-1177.84 -405.75)"/>
            </svg>
         }
         {type === 'loading'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 24 24">
               <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8a8 8 0 0 1-8 8z" opacity=".5" fill={color}/>
               <path d="M20 12h2A10 10 0 0 0 12 2v2a8 8 0 0 1 8 8z" fill={color}>
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
               </path>
            </svg>
         }
         {type === 'menu'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 24 24">
               <path d="M4 6h16M4 12h16M4 18h16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
         }
         {type === 'close'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 24 24">
               <path fill={color} d="M5.293 5.293a1 1 0 0 1 1.414 0L12 10.586l5.293-5.293a1 1 0 1 1 1.414 1.414L13.414 12l5.293 5.293a1 1 0 0 1-1.414 1.414L12 13.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L10.586 12L5.293 6.707a1 1 0 0 1 0-1.414z"/>
            </svg>
         }
         {type === 'download'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 24 24">
               <path fill={color} d="M12 16l4-5h-3V4h-2v7H8z" />
               <path fill={color} d="M20 18H4v-7H2v7c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2v-7h-2v7z" />
            </svg>
         }
         {type === 'trash'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 24 24">
               <path d="M5 20a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8h2V6h-4V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H3v2h2zM9 4h6v2H9zM8 8h9v12H7V8z" fill={color} />
               <path d="M9 10h2v8H9zm4 0h2v8h-2z" fill={color} />
            </svg>
         }
         {type === 'edit'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 1024 1024">
            <path fill={color} d="M257.7 752c2 0 4-.2 6-.5L431.9 722c2-.4 3.9-1.3 5.3-2.8l423.9-423.9a9.96 9.96 0 0 0 0-14.1L694.9 114.9c-1.9-1.9-4.4-2.9-7.1-2.9s-5.2 1-7.1 2.9L256.8 538.8c-1.5 1.5-2.4 3.3-2.8 5.3l-29.5 168.2a33.5 33.5 0 0 0 9.4 29.8c6.6 6.4 14.9 9.9 23.8 9.9zm67.4-174.4L687.8 215l73.3 73.3l-362.7 362.6l-88.9 15.7l15.6-89zM880 836H144c-17.7 0-32 14.3-32 32v36c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-36c0-17.7-14.3-32-32-32z" />
            </svg>
         }
         {type === 'check'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 24 24">
               <g fill="none"><path d="M8.818 19.779l-6.364-6.364l2.83-2.83l3.534 3.544l9.898-9.908l2.83 2.83L8.818 19.779z" fill={color} /></g>
            </svg>
         }
         {type === 'error'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 36 36">
            <path fill={color} d="M18 6a12 12 0 1 0 12 12A12 12 0 0 0 18 6zm-1.49 6a1.49 1.49 0 0 1 3 0v6.89a1.49 1.49 0 1 1-3 0zM18 25.5a1.72 1.72 0 1 1 1.72-1.72A1.72 1.72 0 0 1 18 25.5z" />
            </svg>
         }
         {type === 'question'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 24 24">
               <g fill="none"><path d="M12 22c-5.52-.006-9.994-4.48-10-10v-.2C2.11 6.305 6.635 1.928 12.13 2c5.497.074 9.904 4.569 9.868 10.065C21.962 17.562 17.497 22 12 22zm-.016-2H12a8 8 0 1 0-.016 0zM13 18h-2v-2h2v2zm0-3h-2a3.583 3.583 0 0 1 1.77-3.178C13.43 11.316 14 10.88 14 10a2 2 0 1 0-4 0H8v-.09a4 4 0 1 1 8 .09a3.413 3.413 0 0 1-1.56 2.645A3.1 3.1 0 0 0 13 15z" fill={color} /></g>
            </svg>
         }
         {type === 'caret-left'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 256 256">
               <path fill={color} d="M160 216a7.975 7.975 0 0 1-5.657-2.343l-80-80a8 8 0 0 1 0-11.314l80-80a8 8 0 0 1 11.314 11.314L91.314 128l74.343 74.343A8 8 0 0 1 160 216z" />
            </svg>
         }
         {type === 'caret-right'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 256 256">
               <path fill={color} d="M96 216a8 8 0 0 1-5.657-13.657L164.686 128L90.343 53.657a8 8 0 0 1 11.314-11.314l80 80a8 8 0 0 1 0 11.314l-80 80A7.975 7.975 0 0 1 96 216z" />
            </svg>
         }
         {type === 'caret-down'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 256 256">
               <path fill={color} d="M128 188a11.962 11.962 0 0 1-8.485-3.515l-80-80a12 12 0 0 1 16.97-16.97L128 159.029l71.515-71.514a12 12 0 0 1 16.97 16.97l-80 80A11.962 11.962 0 0 1 128 188z" />
            </svg>
         }
         {type === 'caret-up'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 256 256">
               <path fill={color} d="M208 172a11.962 11.962 0 0 1-8.485-3.515L128 96.971l-71.515 71.514a12 12 0 0 1-16.97-16.97l80-80a12 12 0 0 1 16.97 0l80 80A12 12 0 0 1 208 172z" />
            </svg>
         }
         {type === 'search'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 1024 1024">
               <path fill={color} d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1c-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0 0 11.6 0l43.6-43.5a8.2 8.2 0 0 0 0-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"/>
            </svg>
         }
         {type === 'settings'
            && <svg width={size} viewBox="0 0 16 16" {...xmlnsProps}>
               <path fill={color} fillRule="evenodd" clipRule="evenodd" d="M3.5 2h-1v5h1V2zm6.1 5H6.4L6 6.45v-1L6.4 5h3.2l.4.5v1l-.4.5zm-5 3H1.4L1 9.5v-1l.4-.5h3.2l.4.5v1l-.4.5zm3.9-8h-1v2h1V2zm-1 6h1v6h-1V8zm-4 3h-1v3h1v-3zm7.9 0h3.19l.4-.5v-.95l-.4-.5H11.4l-.4.5v.95l.4.5zm2.1-9h-1v6h1V2zm-1 10h1v2h-1v-2z" />
            </svg>
         }
         {type === 'settings-alt'
            && <svg width={size} viewBox="0 0 32 32" {...xmlnsProps}>
               <path d="M27 16.76V16v-.77l1.92-1.68A2 2 0 0 0 29.3 11l-2.36-4a2 2 0 0 0-1.73-1a2 2 0 0 0-.64.1l-2.43.82a11.35 11.35 0 0 0-1.31-.75l-.51-2.52a2 2 0 0 0-2-1.61h-4.68a2 2 0 0 0-2 1.61l-.51 2.52a11.48 11.48 0 0 0-1.32.75l-2.38-.86A2 2 0 0 0 6.79 6a2 2 0 0 0-1.73 1L2.7 11a2 2 0 0 0 .41 2.51L5 15.24v1.53l-1.89 1.68A2 2 0 0 0 2.7 21l2.36 4a2 2 0 0 0 1.73 1a2 2 0 0 0 .64-.1l2.43-.82a11.35 11.35 0 0 0 1.31.75l.51 2.52a2 2 0 0 0 2 1.61h4.72a2 2 0 0 0 2-1.61l.51-2.52a11.48 11.48 0 0 0 1.32-.75l2.42.82a2 2 0 0 0 .64.1a2 2 0 0 0 1.73-1l2.28-4a2 2 0 0 0-.41-2.51zM25.21 24l-3.43-1.16a8.86 8.86 0 0 1-2.71 1.57L18.36 28h-4.72l-.71-3.55a9.36 9.36 0 0 1-2.7-1.57L6.79 24l-2.36-4l2.72-2.4a8.9 8.9 0 0 1 0-3.13L4.43 12l2.36-4l3.43 1.16a8.86 8.86 0 0 1 2.71-1.57L13.64 4h4.72l.71 3.55a9.36 9.36 0 0 1 2.7 1.57L25.21 8l2.36 4l-2.72 2.4a8.9 8.9 0 0 1 0 3.13L27.57 20z" fill={color} />
               <path d="M16 22a6 6 0 1 1 6-6a5.94 5.94 0 0 1-6 6zm0-10a3.91 3.91 0 0 0-4 4a3.91 3.91 0 0 0 4 4a3.91 3.91 0 0 0 4-4a3.91 3.91 0 0 0-4-4z" fill={color} />
            </svg>
         }
         {type === 'logout'
            && <svg width={size} viewBox="0 0 24 24" {...xmlnsProps}>
               <path d="M3 5c0-1.1.9-2 2-2h8v2H5v14h8v2H5c-1.1 0-2-.9-2-2V5zm14.176 6L14.64 8.464l1.414-1.414l4.95 4.95l-4.95 4.95l-1.414-1.414L17.176 13H10.59v-2h6.586z" fill={color}fillRule="evenodd"/>
            </svg>
         }
         {type === 'reload'
            && <svg width={size} viewBox="0 0 344 480" {...xmlnsProps}>
               <path d="M171 69q70 0 120 50t50 121q0 49-26 91l-31-31q15-28 15-60q0-53-37.5-90.5T171 112v64L85 91l86-86v64zm0 299v-64l85 85l-85 86v-64q-71 0-121-50T0 240q0-49 26-91l32 31q-15 28-15 60q0 53 37.5 90.5T171 368z" fill={color}/>
            </svg>
         }
         {type === 'dots'
            && <svg width={size} viewBox="0 0 24 24" {...xmlnsProps}>
               <path d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 1 1-2 0a1 1 0 0 1 2 0zm7 0a1 1 0 1 1-2 0a1 1 0 0 1 2 0zm7 0a1 1 0 1 1-2 0a1 1 0 0 1 2 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
         }
         {type === 'hamburger'
            && <svg width={size} viewBox="0 0 15 15" {...xmlnsProps}>
               <g fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M1.5 3a.5.5 0 0 0 0 1h12a.5.5 0 0 0 0-1h-12zM1 7.5a.5.5 0 0 1 .5-.5h12a.5.5 0 0 1 0 1h-12a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h12a.5.5 0 0 1 0 1h-12a.5.5 0 0 1-.5-.5z" fill={color} />
               </g>
            </svg>
         }
         {type === 'star'
            && <svg width={size} viewBox="0 0 24 24" {...xmlnsProps}>
                  <path fill={color} d="m12 15.39l-3.76 2.27l.99-4.28l-3.32-2.88l4.38-.37L12 6.09l1.71 4.04l4.38.37l-3.32 2.88l.99 4.28M22 9.24l-7.19-.61L12 2L9.19 8.63L2 9.24l5.45 4.73L5.82 21L12 17.27L18.18 21l-1.64-7.03z"></path>
               </svg>
         }
         {type === 'star-filled'
            && <svg width={size} viewBox="0 0 24 24" {...xmlnsProps}>
                  <path fill={color} d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2L9.19 8.62L2 9.24l5.45 4.73L5.82 21z"></path>
               </svg>
         }
         {type === 'link'
            && <svg width={size} viewBox="0 0 20 20" {...xmlnsProps}>
               <path d="M11 3a1 1 0 1 0 0 2h2.586l-6.293 6.293a1 1 0 1 0 1.414 1.414L15 6.414V9a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-5z" fill={color} />
               <path d="M5 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3H5V7h3a1 1 0 0 0 0-2H5z" fill={color} />
            </svg>
         }
         {type === 'link-alt'
            && <svg width={size} viewBox="0 0 20 20" {...xmlnsProps}>
               <g fill="none">
                  <path d="M14.828 12l1.415 1.414l2.828-2.828a4 4 0 0 0-5.657-5.657l-2.828 2.828L12 9.172l2.828-2.829a2 2 0 1 1 2.829 2.829L14.828 12z" fill={color} />
                  <path d="M12 14.829l1.414 1.414l-2.828 2.828a4 4 0 0 1-5.657-5.657l2.828-2.828L9.172 12l-2.829 2.829a2 2 0 1 0 2.829 2.828L12 14.828z" fill={color} />
                  <path d="M14.829 10.586a1 1 0 0 0-1.415-1.415l-4.242 4.243a1 1 0 1 0 1.414 1.414l4.242-4.242z" fill={color} />
               </g>
            </svg>
         }
         {type === 'clock'
            && <svg width={size} viewBox="0 0 24 24" {...xmlnsProps}>
               <g fill="none"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0a9 9 0 0 1 18 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></g>
            </svg>
         }
         {type === 'sort'
            && <svg width={size} viewBox="0 0 48 48" {...xmlnsProps}>
               <g fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M25 14l-9-9l-9 9"/><path d="M15.992 31V5"/><path d="M42 34l-9 9l-9-9"/><path d="M32.992 17v26"/></g>
            </svg>
         }
         {type === 'desktop'
            && <svg width={size} viewBox="0 0 24 24" {...xmlnsProps}>
               <path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H9c-.55 0-1 .45-1 1s.45 1 1 1h6c.55 0 1-.45 1-1s-.45-1-1-1h-1v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 14H4c-.55 0-1-.45-1-1V5c0-.55.45-1 1-1h16c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1z" fill="currentColor"/>
            </svg>
         }
         {type === 'mobile'
            && <svg width={size} viewBox="0 0 24 24" {...xmlnsProps}>
               <g fill="none">
                  <path d="M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               </g>
            </svg>
         }
         {type === 'tags'
            && <svg width={size} viewBox="0 0 1920 1536" {...xmlnsProps}>
               <path d="M448 320q0-53-37.5-90.5T320 192t-90.5 37.5T192 320t37.5 90.5T320 448t90.5-37.5T448 320zm1067 576q0 53-37 90l-491 492q-39 37-91 37q-53 0-90-37L91 762q-38-37-64.5-101T0 544V128q0-52 38-90t90-38h416q53 0 117 26.5T763 91l715 714q37 39 37 91zm384 0q0 53-37 90l-491 492q-39 37-91 37q-36 0-59-14t-53-45l470-470q37-37 37-90q0-52-37-91L923 91q-38-38-102-64.5T704 0h224q53 0 117 26.5T1147 91l715 714q37 39 37 91z" fill={color} />
            </svg>
         }
         {type === 'filter'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 24 24">
               <path d="M5.5 5h13a1 1 0 0 1 .5 1.5L14 12v7l-4-3v-4L5 6.5A1 1 0 0 1 5.5 5" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
         }
         {type === 'idea'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 24 24">
                  <g fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M3 12h1m8-9v1m8 8h1M5.6 5.6l.7.7m12.1-.7l-.7.7"/>
                     <path d="M9 16a5 5 0 1 1 6 0a3.5 3.5 0 0 0-1 3a2 2 0 0 1-4 0a3.5 3.5 0 0 0-1-3"/>
                     <path d="M9.7 17h4.6"/>
                  </g>
               </svg>
         }
         {type === 'tracking'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 24 24">
                  <path fill={color} d="M21 7a.78.78 0 0 0 0-.21a.64.64 0 0 0-.05-.17a1.1 1.1 0 0 0-.09-.14a.75.75 0 0 0-.14-.17l-.12-.07a.69.69 0 0 0-.19-.1h-.2A.7.7 0 0 0 20 6h-5a1 1 0 0 0 0 2h2.83l-4 4.71l-4.32-2.57a1 1 0 0 0-1.28.22l-5 6a1 1 0 0 0 .13 1.41A1 1 0 0 0 4 18a1 1 0 0 0 .77-.36l4.45-5.34l4.27 2.56a1 1 0 0 0 1.27-.21L19 9.7V12a1 1 0 0 0 2 0V7z"/>
               </svg>
         }
         {type === 'google'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 256 262">
                  <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"/>
                  <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"/>
                  <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"/>
                  <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335" />
               </svg>
         }
         {type === 'adwords'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 256 256">
                  <g>
                     <path d="M5.888,166.405103 L90.88,20.9 C101.676138,27.2558621 156.115862,57.3844138 164.908138,63.1135172 L79.9161379,208.627448 C70.6206897,220.906621 -5.888,185.040138 5.888,166.396276 L5.888,166.405103 Z" fill="#FBBC04"></path>
                     <path d="M250.084224,166.401789 L165.092224,20.9055131 C153.210293,1.13172 127.619121,-6.05393517 106.600638,5.62496138 C85.582155,17.3038579 79.182155,42.4624786 91.0640861,63.1190303 L176.056086,208.632961 C187.938017,228.397927 213.52919,235.583582 234.547672,223.904686 C254.648086,212.225789 261.966155,186.175582 250.084224,166.419444 L250.084224,166.401789 Z" fill="#4285F4"></path>
                     <ellipse fill="#34A853" cx="42.6637241" cy="187.924414" rx="42.6637241" ry="41.6044138"></ellipse>
                  </g>
               </svg>
         }
         {type === 'keywords'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 24 24">
                  <path fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 12h14M5 16h6"></path>
               </svg>
         }
         {type === 'integration'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 24 24">
                  <path fill="none" stroke={color} strokeWidth={2} d="M10 21c-2.5 2.5-5 2-7 0s-2.5-4.5 0-7l3-3l7 7zm4-18c2.5-2.5 5-2 7.001 0c2.001 2 2.499 4.5 0 7l-3 3L11 6zm-3 7l-2.5 2.5zm3 3l-2.5 2.5z"></path>
               </svg>
         }

         {type === 'cursor'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 24 24">
                  <path fill="none" stroke={color} strokeWidth="2" d="M6 3l12 11l-5 1l3 5.5l-3 1.5l-3-6l-4 3z"/>
               </svg>
         }
         {type === 'eye'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 24 24">
                  <g fill="none">
                     <path d="M21.257 10.962c.474.62.474 1.457 0 2.076C19.764 14.987 16.182 19 12 19c-4.182 0-7.764-4.013-9.257-5.962a1.692 1.692 0 0 1 0-2.076C4.236 9.013 7.818 5 12 5c4.182 0 7.764 4.013 9.257 5.962z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                     <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
               </svg>
         }
         {type === 'eye-closed'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 24 24">
                  <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                     <path d="M6.873 17.129c-1.845-1.31-3.305-3.014-4.13-4.09a1.693 1.693 0 0 1 0-2.077C4.236 9.013 7.818 5 12 5c1.876 0 3.63.807 5.13 1.874"/>
                     <path d="M14.13 9.887a3 3 0 1 0-4.243 4.242M4 20L20 4M10 18.704A7.124 7.124 0 0 0 12 19c4.182 0 7.764-4.013 9.257-5.962a1.694 1.694 0 0 0-.001-2.078A22.939 22.939 0 0 0 19.57 9"/>
                  </g>
               </svg>
         }
         {type === 'target'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 24 24">
                  <path d="M19.938 13A8.004 8.004 0 0 1 13 19.938V22h-2v-2.062A8.004 8.004 0 0 1 4.062 13H2v-2h2.062A8.004 8.004 0 0 1 11 4.062V2h2v2.062A8.004 8.004 0 0 1 19.938 11H22v2h-2.062zM12 18a6 6 0 1 0 0-12a6 6 0 0 0 0 12zm0-3a3 3 0 1 0 0-6a3 3 0 0 0 0 6z" fill={color} fillRule="nonzero"/>
               </svg>
         }
         {type === 'help'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 24 24">
                  <path d="M12 4c4.411 0 8 3.589 8 8s-3.589 8-8 8s-8-3.589-8-8s3.589-8 8-8m0-2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2zm4 8a4 4 0 0 0-8 0h2c0-1.103.897-2 2-2s2 .897 2 2s-.897 2-2 2a1 1 0 0 0-1 1v2h2v-1.141A3.991 3.991 0 0 0 16 10zm-3 6h-2v2h2v-2z" fill={color} />
               </svg>
         }
         {type === 'date'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 24 24">
                  <path d="M22 2.25h-3.25V.75a.75.75 0 0 0-1.5-.001V2.25h-4.5V.75a.75.75 0 0 0-1.5-.001V2.25h-4.5V.75a.75.75 0 0 0-1.5-.001V2.25H2a2 2 0 0 0-2 1.999v17.75a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V4.249a2 2 0 0 0-2-1.999zM22.5 22a.5.5 0 0 1-.499.5H2a.5.5 0 0 1-.5-.5V4.25a.5.5 0 0 1 .5-.499h3.25v1.5a.75.75 0 0 0 1.5.001V3.751h4.5v1.5a.75.75 0 0 0 1.5.001V3.751h4.5v1.5a.75.75 0 0 0 1.5.001V3.751H22a.5.5 0 0 1 .499.499z" fill={color} />
                  <path d="M5.25 9h3v2.25h-3z" fill={color} />
                  <path d="M5.25 12.75h3V15h-3z" fill={color} />
                  <path d="M5.25 16.5h3v2.25h-3z" fill={color} />
                  <path d="M10.5 16.5h3v2.25h-3z" fill={color} />
                  <path d="M10.5 12.75h3V15h-3z" fill={color} />
                  <path d="M10.5 9h3v2.25h-3z" fill={color} />
                  <path d="M15.75 16.5h3v2.25h-3z" fill={color} />
                  <path d="M15.75 12.75h3V15h-3z" fill={color} />
                  <path d="M15.75 9h3v2.25h-3z" fill={color} />
               </svg>
         }
         {type === 'email'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 24 24">
                  <path fill={color} d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2zm-2 0l-8 5l-8-5zm0 12H4V8l8 5l8-5z" />
               </svg>
         }
         {type === 'scraper'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 16 16">
               <path fill={color} d="M1 3.5A2.5 2.5 0 0 1 3.5 1h7A2.5 2.5 0 0 1 13 3.5v1.53a4.538 4.538 0 0 0-1-.004V5H2v5.5A1.5 1.5 0 0 0 3.5 12h2.954l-.72.72a2.52 2.52 0 0 0-.242.28H3.5A2.5 2.5 0 0 1 1 10.5zm7.931 3.224l-.577-.578a.5.5 0 1 0-.708.708l.745.744c.144-.306.324-.6.54-.874M2 4h10v-.5A1.5 1.5 0 0 0 10.5 2h-7A1.5 1.5 0 0 0 2 3.5zm4.354 2.854a.5.5 0 1 0-.708-.708l-2 2a.5.5 0 0 0 0 .708l2 2a.5.5 0 0 0 .708-.708L4.707 8.5zm6.538-.83c.366.042.471.48.21.742l-.975.975a1.507 1.507 0 1 0 2.132 2.132l.975-.975c.261-.261.7-.156.742.21a3.518 3.518 0 0 1-4.676 3.723l-2.726 2.727a1.507 1.507 0 1 1-2.132-2.132L9.168 10.7a3.518 3.518 0 0 1 3.724-4.676" />
            </svg>
         }
         {type === 'city'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 48 48">
                  <g fill="none">
                     <path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M4 42h40"></path>
                     <rect width={8} height={16} x={8} y={26} stroke={color} strokeLinejoin="round" strokeWidth={4} rx={2}></rect>
                     <path stroke={color} strokeLinecap="square" strokeLinejoin="round" strokeWidth={4} d="M12 34h1"></path>
                     <rect width={24} height={38} x={16} y={4} stroke={color} strokeLinejoin="round" strokeWidth={4} rx={2}></rect>
                     <path fill={color} d="M22 10h4v4h-4zm8 0h4v4h-4zm-8 7h4v4h-4zm8 0h4v4h-4zm0 7h4v4h-4zm0 7h4v4h-4z"></path>
                  </g>
               </svg>
         }
         {type === 'research'
            && <svg width={size} viewBox="0 0 48 48" {...xmlnsProps}>
                  <g fill="none" stroke={color} strokeWidth={4}>
                     <path strokeLinecap="round" d="M4 7h40M4 23h11M4 39h11"></path>
                     <path d="M31.5 34a8.5 8.5 0 1 0 0-17a8.5 8.5 0 0 0 0 17Z"></path>
                     <path strokeLinecap="round" d="m37 32l7 7.05"></path>
                  </g>
               </svg>
         }
         {type === 'domains'
            && <svg {...xmlnsProps} width={size} viewBox="0 0 56 56">
                  <path fill={color} d="M7.328 43.504c.445 0 .914-.14 1.383-.469V17.957c0-.844.164-1.172.914-1.57L31.352 3.87c.07-1.547-.915-2.508-2.25-2.508c-.61 0-1.266.164-1.97.586L7.493 13.246c-2.297 1.336-2.578 1.758-2.578 4.43v22.43c0 2.015.96 3.398 2.414 3.398m9.375 5.414c.422 0 .89-.14 1.383-.469V23.371c0-.914.117-1.148.89-1.57L40.703 9.26c.07-1.523-.89-2.507-2.25-2.507c-.586 0-1.266.187-1.945.562L16.82 18.636c-2.297 1.313-2.555 1.805-2.555 4.43V45.52c0 2.015 1.008 3.398 2.438 3.398m10.031 5.719c.82 0 1.805-.328 2.977-.985l18.375-10.547c2.156-1.242 3-2.53 3-5.156l-.047-21.234c0-2.813-1.008-4.242-2.766-4.242c-.773 0-1.758.304-2.859.937L26.992 24.027c-2.203 1.29-2.977 2.602-2.977 5.157v21.234c0 2.719.961 4.219 2.72 4.219M28 50.067c-.117-.024-.164-.094-.164-.258L28 29.254c0-.89.258-1.36 1.055-1.805l17.742-10.43c.07-.046.14-.046.234-.023c.094.024.164.094.164.258l-.07 20.625c0 .773-.281 1.36-1.055 1.828L28.234 50.043a.284.284 0 0 1-.234.023"></path>
               </svg>
         }
       </span>
   );
 };

 export default Icon;
