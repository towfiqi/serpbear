/* eslint-disable import/prefer-default-export */
export const isValidDomain = (domain:string): boolean => {
   if (typeof domain !== 'string') return false;
   if (!domain.includes('.')) return false;
   let value = domain;
   const validHostnameChars = /^[a-zA-Z0-9-.]{1,253}\.?$/g;
   if (!validHostnameChars.test(value)) {
     return false;
   }

   if (value.endsWith('.')) {
     value = value.slice(0, value.length - 1);
   }

   if (value.length > 253) {
     return false;
   }

   const labels = value.split('.');

   const isValid = labels.every((label) => {
     const validLabelChars = /^([a-zA-Z0-9-]+)$/g;

     const validLabel = (
       validLabelChars.test(label)
       && label.length < 64
       && !label.startsWith('-')
       && !label.endsWith('-')
     );

     return validLabel;
   });

   return isValid;
 };
