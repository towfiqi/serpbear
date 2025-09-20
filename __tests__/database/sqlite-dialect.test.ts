/** @jest-environment node */

import sqlite from '../../database/sqlite-dialect';

describe('sqlite dialect wrapper', () => {
  it('runs basic statements and exposes sqlite-style metadata', async () => {
    await new Promise<void>((resolve, reject) => {
      const sqliteFlags = sqlite.OPEN_READWRITE + sqlite.OPEN_CREATE;
      const db = new sqlite.Database(':memory:', sqliteFlags, (err) => {
        if (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
          return;
        }

        db.serialize(async () => {
          try {
            await new Promise<void>((res, rej) => {
              db.run('CREATE TABLE sample (id INTEGER PRIMARY KEY, name TEXT)', (createErr) => {
                if (createErr) {
                  rej(createErr instanceof Error ? createErr : new Error(String(createErr)));
                  return;
                }
                res();
              });
            });

            await new Promise<void>((res, rej) => {
              db.run('INSERT INTO sample (name) VALUES ($name)', { $name: 'test-entry' }, function insertCallback(insertErr) {
                if (insertErr) {
                  rej(insertErr instanceof Error ? insertErr : new Error(String(insertErr)));
                  return;
                }
                expect(this.lastID).toBe(1);
                expect(this.changes).toBe(1);
                res();
              });
            });

            await new Promise<void>((res, rej) => {
              db.all<{ name: string }>('SELECT name FROM sample', (queryErr, rows) => {
                if (queryErr) {
                  rej(queryErr instanceof Error ? queryErr : new Error(String(queryErr)));
                  return;
                }
                expect(rows).toEqual([{ name: 'test-entry' }]);
                res();
              });
            });

            db.close((closeErr) => {
              if (closeErr) {
                reject(closeErr instanceof Error ? closeErr : new Error(String(closeErr)));
                return;
              }
              resolve();
            });
          } catch (error) {
            const wrappedError = error instanceof Error ? error : new Error(String(error));
            reject(wrappedError);
          }
        });
      });
    });
  });
});
