import { computeMapPackTop3 } from '../../utils/mapPack';

describe('computeMapPackTop3', () => {
  const locals = [
    { position: 1, title: 'Acme Plumbing' },
    { position: 2, title: 'Other Co' },
    { position: 3, title: 'Third Ltd' },
    { position: 4, title: 'Fourth Inc' },
  ];

  it('matches the business name against the top three local results', () => {
    expect(computeMapPackTop3('example.com', locals, 'Acme Plumbing')).toBe(true);
    expect(computeMapPackTop3('example.com', locals, 'Third Ltd')).toBe(true);
  });

  it('ignores case and surrounding whitespace in the name', () => {
    expect(computeMapPackTop3('example.com', locals, '  acme PLUMBING ')).toBe(true);
  });

  it('does not match a business ranked below third', () => {
    expect(computeMapPackTop3('example.com', locals, 'Fourth Inc')).toBe(false);
  });

  it('returns false without a business name, or with no local results', () => {
    expect(computeMapPackTop3('example.com', locals, null)).toBe(false);
    expect(computeMapPackTop3('example.com', [], 'Acme Plumbing')).toBe(false);
    expect(computeMapPackTop3('example.com', undefined, 'Acme Plumbing')).toBe(false);
  });

  it('does not use URLs for matching', () => {
    const withUrl = [{ position: 1, title: 'Other Co', url: 'https://example.com' }];
    expect(computeMapPackTop3('example.com', withUrl, 'Acme Plumbing')).toBe(false);
  });
});
