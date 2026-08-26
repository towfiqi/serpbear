import {
   diagnoseInvalidGoogleSerpHtml,
   formatSerpHtmlParseError,
} from '../../utils/serpHtmlDiagnostics';

describe('diagnoseInvalidGoogleSerpHtml', () => {
   it('detects Google consent pages', () => {
      const html = '<html><body><form action="https://consent.google.com/save">Before you continue</form></body></html>';
      expect(diagnoseInvalidGoogleSerpHtml(html)).toBe('consent');
      expect(formatSerpHtmlParseError('consent')).toMatch(/consent\/cookie/i);
   });

   it('detects captcha / sorry pages', () => {
      const html = '<html><body><div id="recaptcha">Our systems have detected unusual traffic from your computer network</div></body></html>';
      expect(diagnoseInvalidGoogleSerpHtml(html)).toBe('captcha');
   });

   it('detects JavaScript-required interstitial', () => {
      const html = '<html><body><noscript>Please enable JavaScript to continue</noscript></body></html>';
      expect(diagnoseInvalidGoogleSerpHtml(html)).toBe('javascript_required');
   });

   it('falls back to missing containers for unknown HTML', () => {
      expect(diagnoseInvalidGoogleSerpHtml('<html><body><div>hello</div></body></html>')).toBe('missing_serp_containers');
      expect(formatSerpHtmlParseError('missing_serp_containers')).toMatch(/#search\/#rso/);
   });
});
