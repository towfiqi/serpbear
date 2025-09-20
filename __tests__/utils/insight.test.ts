import { getCountryInsight, getKeywordsInsight, getPagesInsight } from '../../utils/insight';

describe('Insight Functions', () => {
  const mockSCData: SCDomainDataType = {
    threeDays: [
      {
        keyword: 'test keyword 1',
        uid: 'us:desktop:test_keyword_1',
        device: 'desktop',
        country: 'US',
        clicks: 10,
        impressions: 100,
        ctr: 10,
        position: 5,
        page: '/page1'
      },
      {
        keyword: 'test keyword 2',
        uid: 'ca:mobile:test_keyword_2',
        device: 'mobile',
        country: 'CA',
        clicks: 20,
        impressions: 200,
        ctr: 10,
        position: 3,
        page: '/page2'
      },
      {
        keyword: 'test keyword 1',
        uid: 'ca:desktop:test_keyword_1',
        device: 'desktop',
        country: 'CA',
        clicks: 5,
        impressions: 50,
        ctr: 10,
        position: 7,
        page: '/page1'
      }
    ],
    sevenDays: [],
    thirtyDays: [],
    lastFetched: new Date().toISOString(),
    lastFetchError: '',
    stats: []
  };

  describe('getCountryInsight', () => {
    it('should return country insights with correct data', () => {
      const result = getCountryInsight(mockSCData, 'clicks', 'threeDays');
      
      expect(result).toHaveLength(2);
      
      // Check US data
      const usData = result.find(item => item.country === 'US');
      expect(usData).toBeDefined();
      expect(usData?.clicks).toBe(10);
      expect(usData?.impressions).toBe(100);
      expect(usData?.keywords).toBe(1);
      
      // Check CA data
      const caData = result.find(item => item.country === 'CA');
      expect(caData).toBeDefined();
      expect(caData?.clicks).toBe(25); // 20 + 5
      expect(caData?.impressions).toBe(250); // 200 + 50
      expect(caData?.keywords).toBe(2); // 'test keyword 2' + 'test keyword 1'
    });

    it('should handle empty data gracefully', () => {
      const emptyData: SCDomainDataType = {
        threeDays: [],
        sevenDays: [],
        thirtyDays: [],
        lastFetched: '',
        lastFetchError: '',
        stats: []
      };
      
      const result = getCountryInsight(emptyData, 'clicks', 'threeDays');
      expect(result).toEqual([]);
    });

    it('should handle invalid data gracefully', () => {
      const result = getCountryInsight(null as any, 'clicks', 'threeDays');
      expect(result).toEqual([]);
    });
  });

  describe('getKeywordsInsight', () => {
    it('should return keyword insights with correct country data', () => {
      const result = getKeywordsInsight(mockSCData, 'clicks', 'threeDays');
      
      expect(result).toHaveLength(2);
      
      // Check 'test keyword 1' - should appear in 2 countries (US, CA)
      const keyword1Data = result.find(item => item.keyword === 'test keyword 1');
      expect(keyword1Data).toBeDefined();
      expect(keyword1Data?.clicks).toBe(15); // 10 + 5
      expect(keyword1Data?.countries).toBe(2); // US + CA
      
      // Check 'test keyword 2' - should appear in 1 country (CA)
      const keyword2Data = result.find(item => item.keyword === 'test keyword 2');
      expect(keyword2Data).toBeDefined();
      expect(keyword2Data?.clicks).toBe(20);
      expect(keyword2Data?.countries).toBe(1); // CA only
    });

    it('should handle empty data gracefully', () => {
      const emptyData: SCDomainDataType = {
        threeDays: [],
        sevenDays: [],
        thirtyDays: [],
        lastFetched: '',
        lastFetchError: '',
        stats: []
      };
      
      const result = getKeywordsInsight(emptyData, 'clicks', 'threeDays');
      expect(result).toEqual([]);
    });

    it('should handle invalid data gracefully', () => {
      const result = getKeywordsInsight(null as any, 'clicks', 'threeDays');
      expect(result).toEqual([]);
    });
  });

  describe('getPagesInsight', () => {
    it('should return page insights with correct data', () => {
      const result = getPagesInsight(mockSCData, 'clicks', 'threeDays');
      
      expect(result).toHaveLength(2);
      
      // Check /page1
      const page1Data = result.find(item => item.page === '/page1');
      expect(page1Data).toBeDefined();
      expect(page1Data?.clicks).toBe(15); // 10 + 5
      expect(page1Data?.keywords).toBe(2); // 2 occurrences of 'test keyword 1'
      expect(page1Data?.countries).toBe(2); // US + CA
      
      // Check /page2
      const page2Data = result.find(item => item.page === '/page2');
      expect(page2Data).toBeDefined();
      expect(page2Data?.clicks).toBe(20);
      expect(page2Data?.keywords).toBe(1); // 1 occurrence of 'test keyword 2'
      expect(page2Data?.countries).toBe(1); // CA only
    });

    it('should handle empty data gracefully', () => {
      const emptyData: SCDomainDataType = {
        threeDays: [],
        sevenDays: [],
        thirtyDays: [],
        lastFetched: '',
        lastFetchError: '',
        stats: []
      };
      
      const result = getPagesInsight(emptyData, 'clicks', 'threeDays');
      expect(result).toEqual([]);
    });

    it('should handle invalid data gracefully', () => {
      const result = getPagesInsight(null as any, 'clicks', 'threeDays');
      expect(result).toEqual([]);
    });
  });

  describe('Data integrity and bug fixes', () => {
    it('should correctly populate countries array in keyword insights (bug fix verification)', () => {
      const result = getKeywordsInsight(mockSCData, 'clicks', 'threeDays');
      
      const keyword1Data = result.find(item => item.keyword === 'test keyword 1');
      // Before the fix, this would be counting keywords instead of countries
      expect(keyword1Data?.countries).toBe(2); // Should be 2 countries: US, CA
      
      const keyword2Data = result.find(item => item.keyword === 'test keyword 2');
      expect(keyword2Data?.countries).toBe(1); // Should be 1 country: CA
    });

    it('should handle null/undefined values in data', () => {
      const malformedData: SCDomainDataType = {
        threeDays: [
          {
            keyword: 'test keyword',
            uid: 'us:desktop:test_keyword',
            device: 'desktop',
            country: 'US',
            clicks: null as any,
            impressions: undefined as any,
            ctr: 10,
            position: 5,
            page: '/page1'
          }
        ],
        sevenDays: [],
        thirtyDays: [],
        lastFetched: '',
        lastFetchError: '',
        stats: []
      };

      const keywordResult = getKeywordsInsight(malformedData, 'clicks', 'threeDays');
      expect(keywordResult).toHaveLength(1);
      expect(keywordResult[0].clicks).toBe(0); // Should default to 0
      expect(keywordResult[0].impressions).toBe(0); // Should default to 0

      const countryResult = getCountryInsight(malformedData, 'clicks', 'threeDays');
      expect(countryResult).toHaveLength(1);
      expect(countryResult[0].clicks).toBe(0); // Should default to 0
      expect(countryResult[0].impressions).toBe(0); // Should default to 0

      const pageResult = getPagesInsight(malformedData, 'clicks', 'threeDays');
      expect(pageResult).toHaveLength(1);
      expect(pageResult[0].clicks).toBe(0); // Should default to 0
      expect(pageResult[0].impressions).toBe(0); // Should default to 0
    });
  });
});