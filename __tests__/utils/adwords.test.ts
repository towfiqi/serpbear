import { extractAdwordskeywordIdeas, getGoogleAdsLoginCustomerID } from '../../utils/adwords';

jest.mock('../../database/models/keyword', () => ({
   __esModule: true,
   default: { findAll: jest.fn() },
}));
jest.mock('../../utils/searchConsole', () => ({ readLocalSCData: jest.fn() }));

describe('Google Ads keyword ideas', () => {
   const originalLoginCustomerID = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

   afterEach(() => {
      if (originalLoginCustomerID === undefined) {
         delete process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
      } else {
         process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID = originalLoginCustomerID;
      }
   });

   it('keeps positive-volume niche ideas', () => {
      const ideas = extractAdwordskeywordIdeas([{
         text: 'niche keyword',
         keywordIdeaMetrics: {
            competition: 'LOW',
            competitionIndex: '1',
            avgMonthlySearches: '10',
            monthlySearchVolumes: [],
            lowTopOfPageBidMicros: '0',
            highTopOfPageBidMicros: '0',
         },
         keywordAnnotations: {},
      }], { country: 'US', domain: 'example.com' });

      expect(ideas).toHaveLength(1);
      expect(ideas[0]).toMatchObject({ keyword: 'niche keyword', avgMonthlySearches: 10 });
   });

   it('continues to exclude zero-volume ideas', () => {
      const ideas = extractAdwordskeywordIdeas([{
         text: 'zero volume keyword',
         keywordIdeaMetrics: {
            competition: 'LOW',
            competitionIndex: '1',
            avgMonthlySearches: '0',
            monthlySearchVolumes: [],
            lowTopOfPageBidMicros: '0',
            highTopOfPageBidMicros: '0',
         },
         keywordAnnotations: {},
      }], { country: 'US', domain: 'example.com' });

      expect(ideas).toHaveLength(0);
   });

   it('uses an optional manager account for login-customer-id', () => {
      process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID = '123-456-7890';
      expect(getGoogleAdsLoginCustomerID('9999999999')).toBe('1234567890');
   });

   it('falls back to the operating customer when no manager is configured', () => {
      delete process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
      expect(getGoogleAdsLoginCustomerID('999-999-9999')).toBe('9999999999');
   });
});
