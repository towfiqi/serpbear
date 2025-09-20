// Email throttling cache to prevent spam
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

interface EmailCache {
   [domain: string]: {
      lastSent: string;
      count: number;
   }
}

const CACHE_FILE = path.join(process.cwd(), 'data', 'email-throttle.json');
const MIN_EMAIL_INTERVAL = 60 * 60 * 1000; // 1 hour minimum between emails
const MAX_EMAILS_PER_DAY = 5; // Maximum emails per domain per day

/**
 * Check if email can be sent based on throttling rules
 */
export const canSendEmail = async (domain: string): Promise<{ canSend: boolean; reason?: string }> => {
   try {
      const cache = await getEmailCache();
      const now = new Date();
      const today = now.toDateString();
      
      const domainCache = cache[domain];
      
      if (!domainCache) {
         return { canSend: true };
      }
      
      const lastSentDate = new Date(domainCache.lastSent);
      const lastSentToday = lastSentDate.toDateString();
      
      // Reset daily count if it's a new day
      if (lastSentToday !== today) {
         domainCache.count = 0;
      }
      
      // Check daily limit
      if (domainCache.count >= MAX_EMAILS_PER_DAY) {
         return { 
            canSend: false, 
            reason: `Daily email limit reached (${MAX_EMAILS_PER_DAY}). Next email can be sent tomorrow.`
         };
      }
      
      // Check minimum interval
      const timeSinceLastEmail = now.getTime() - lastSentDate.getTime();
      if (timeSinceLastEmail < MIN_EMAIL_INTERVAL) {
         const waitTime = MIN_EMAIL_INTERVAL - timeSinceLastEmail;
         const waitMinutes = Math.ceil(waitTime / (60 * 1000));
         return { 
            canSend: false, 
            reason: `Minimum interval not met. Wait ${waitMinutes} more minutes before sending next email.`
         };
      }
      
      return { canSend: true };
   } catch (error) {
      console.log('[EMAIL_THROTTLE] Error checking cache, allowing email:', error);
      return { canSend: true };
   }
};

/**
 * Record that an email was sent
 */
export const recordEmailSent = async (domain: string): Promise<void> => {
   try {
      const cache = await getEmailCache();
      const now = new Date();
      const today = now.toDateString();
      
      const domainCache = cache[domain];
      let count = 1;
      
      if (domainCache) {
         const lastSentToday = new Date(domainCache.lastSent).toDateString();
         // If same day, increment count
         if (lastSentToday === today) {
            count = domainCache.count + 1;
         }
      }
      
      cache[domain] = {
         lastSent: now.toISOString(),
         count
      };
      
      await saveEmailCache(cache);
   } catch (error) {
      console.log('[EMAIL_THROTTLE] Error recording email sent:', error);
   }
};

/**
 * Get email cache from file
 */
const getEmailCache = async (): Promise<EmailCache> => {
   try {
      const cacheData = await readFile(CACHE_FILE, 'utf-8');
      return JSON.parse(cacheData) || {};
   } catch (error) {
      // File doesn't exist or is invalid, return empty cache
      return {};
   }
};

/**
 * Save email cache to file
 */
const saveEmailCache = async (cache: EmailCache): Promise<void> => {
   try {
      await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
   } catch (error) {
      console.log('[EMAIL_THROTTLE] Error saving cache:', error);
   }
};