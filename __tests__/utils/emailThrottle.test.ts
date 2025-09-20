import { canSendEmail, recordEmailSent } from '../../utils/emailThrottle';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

// Mock fs/promises
jest.mock('fs/promises');
const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

describe('Email Throttling', () => {
   beforeEach(() => {
      jest.clearAllMocks();
   });

   describe('canSendEmail', () => {
      it('should allow email for new domain', async () => {
         mockReadFile.mockRejectedValue(new Error('File not found'));
         
         const result = await canSendEmail('example.com');
         expect(result.canSend).toBe(true);
         expect(result.reason).toBeUndefined();
      });

      it('should allow email after sufficient time has passed', async () => {
         const oneDayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
         const cacheData = {
            'example.com': {
               lastSent: oneDayAgo.toISOString(),
               count: 1
            }
         };
         
         mockReadFile.mockResolvedValue(JSON.stringify(cacheData));
         
         const result = await canSendEmail('example.com');
         expect(result.canSend).toBe(true);
      });

      it('should block email when daily limit is reached', async () => {
         const today = new Date();
         const cacheData = {
            'example.com': {
               lastSent: today.toISOString(),
               count: 5 // MAX_EMAILS_PER_DAY
            }
         };
         
         mockReadFile.mockResolvedValue(JSON.stringify(cacheData));
         
         const result = await canSendEmail('example.com');
         expect(result.canSend).toBe(false);
         expect(result.reason).toContain('Daily email limit reached');
      });

      it('should block email when minimum interval not met', async () => {
         const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
         const cacheData = {
            'example.com': {
               lastSent: thirtyMinutesAgo.toISOString(),
               count: 1
            }
         };
         
         mockReadFile.mockResolvedValue(JSON.stringify(cacheData));
         
         const result = await canSendEmail('example.com');
         expect(result.canSend).toBe(false);
         expect(result.reason).toContain('Minimum interval not met');
      });

      it('should reset daily count for new day', async () => {
         const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000); // Yesterday
         const cacheData = {
            'example.com': {
               lastSent: yesterday.toISOString(),
               count: 5 // MAX_EMAILS_PER_DAY from yesterday
            }
         };
         
         mockReadFile.mockResolvedValue(JSON.stringify(cacheData));
         
         const result = await canSendEmail('example.com');
         expect(result.canSend).toBe(true); // Should be allowed as it's a new day
      });

      it('should handle cache read errors gracefully', async () => {
         mockReadFile.mockRejectedValue(new Error('Permission denied'));
         
         const result = await canSendEmail('example.com');
         expect(result.canSend).toBe(true); // Should default to allowing
      });
   });

   describe('recordEmailSent', () => {
      it('should record first email for domain', async () => {
         mockReadFile.mockRejectedValue(new Error('File not found')); // No existing cache
         mockWriteFile.mockResolvedValue();
         
         await recordEmailSent('example.com');
         
         expect(mockWriteFile).toHaveBeenCalledWith(
            expect.stringContaining('email-throttle.json'),
            expect.stringContaining('"example.com"'),
            'utf-8'
         );
         
         // Check that count is 1 and lastSent is recent
         const writtenData = JSON.parse(mockWriteFile.mock.calls[0][1] as string);
         expect(writtenData['example.com'].count).toBe(1);
         expect(new Date(writtenData['example.com'].lastSent)).toBeInstanceOf(Date);
      });

      it('should increment count for same day', async () => {
         const today = new Date();
         const existingCache = {
            'example.com': {
               lastSent: today.toISOString(),
               count: 2
            }
         };
         
         mockReadFile.mockResolvedValue(JSON.stringify(existingCache));
         mockWriteFile.mockResolvedValue();
         
         await recordEmailSent('example.com');
         
         const writtenData = JSON.parse(mockWriteFile.mock.calls[0][1] as string);
         expect(writtenData['example.com'].count).toBe(3);
      });

      it('should reset count for new day', async () => {
         const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
         const existingCache = {
            'example.com': {
               lastSent: yesterday.toISOString(),
               count: 4
            }
         };
         
         mockReadFile.mockResolvedValue(JSON.stringify(existingCache));
         mockWriteFile.mockResolvedValue();
         
         await recordEmailSent('example.com');
         
         const writtenData = JSON.parse(mockWriteFile.mock.calls[0][1] as string);
         expect(writtenData['example.com'].count).toBe(1); // Reset to 1 for new day
      });

      it('should handle write errors gracefully', async () => {
         mockReadFile.mockRejectedValue(new Error('File not found'));
         mockWriteFile.mockRejectedValue(new Error('Disk full'));
         
         // Should not throw
         await expect(recordEmailSent('example.com')).resolves.toBeUndefined();
      });
   });
});