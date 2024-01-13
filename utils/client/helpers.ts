/* eslint-disable import/prefer-default-export */
export const formattedNum = (num:number) => new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3 }).format(num);
