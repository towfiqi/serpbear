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

  it('supports variadic parameter bindings across sqlite APIs', async () => {
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
              db.run('CREATE TABLE sample_variadic (id INTEGER PRIMARY KEY, name TEXT, score INTEGER)', (createErr) => {
                if (createErr) {
                  rej(createErr instanceof Error ? createErr : new Error(String(createErr)));
                  return;
                }
                res();
              });
            });

            await new Promise<void>((res, rej) => {
              db.run(
                'INSERT INTO sample_variadic (name, score) VALUES (?, ?)',
                'variadic-entry',
                99,
                function insertCallback(insertErr) {
                  if (insertErr) {
                    rej(insertErr instanceof Error ? insertErr : new Error(String(insertErr)));
                    return;
                  }
                  expect(this.lastID).toBe(1);
                  expect(this.changes).toBe(1);
                  res();
                },
              );
            });

            await new Promise<void>((res, rej) => {
              db.get<{ score: number }>(
                'SELECT score FROM sample_variadic WHERE name = ? AND score = ?',
                'variadic-entry',
                99,
                (queryErr, row) => {
                  if (queryErr) {
                    rej(queryErr instanceof Error ? queryErr : new Error(String(queryErr)));
                    return;
                  }
                  expect(row).toEqual({ score: 99 });
                  res();
                },
              );
            });

            await new Promise<void>((res, rej) => {
              db.all<{ name: string }>(
                'SELECT name FROM sample_variadic WHERE name IN (?, ?)',
                'variadic-entry',
                'not-a-match',
                (queryErr, rows) => {
                  if (queryErr) {
                    rej(queryErr instanceof Error ? queryErr : new Error(String(queryErr)));
                    return;
                  }
                  expect(rows).toEqual([{ name: 'variadic-entry' }]);
                  res();
                },
              );
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

  it('ignores trailing undefined callbacks when deriving sqlite bindings', async () => {
    await new Promise<void>((resolve, reject) => {
      const sqliteFlags = sqlite.OPEN_READWRITE + sqlite.OPEN_CREATE;
      const db = new sqlite.Database(':memory:', sqliteFlags, (err) => {
        if (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
          return;
        }

        db.serialize(async () => {
          type TrackedMethod = 'run' | 'get' | 'all';
          const recordedCalls: Array<{ sql: string; method: TrackedMethod; args: unknown[] }> = [];
          const trackedMethods = new Set<TrackedMethod>(['run', 'get', 'all']);
          const originalPrepare = db.driver.prepare.bind(db.driver);
          const prepareSpy = jest.spyOn(db.driver, 'prepare');
          prepareSpy.mockImplementation((sql: string, ...prepareArgs: unknown[]) => {
            const statement = originalPrepare(sql, ...prepareArgs);
            return new Proxy(statement, {
              get(target, prop, receiver) {
                const value = Reflect.get(target, prop, receiver);
                if (
                  typeof prop === 'string'
                  && trackedMethods.has(prop as TrackedMethod)
                  && typeof value === 'function'
                ) {
                  const method = prop as TrackedMethod;
                  return (...methodArgs: unknown[]) => {
                    recordedCalls.push({ sql, method, args: methodArgs });
                    return value.apply(target, methodArgs);
                  };
                }
                if (typeof value === 'function') {
                  return value.bind(target);
                }
                return value;
              },
            });
          });

          const insertSql = 'INSERT INTO sample_optional (name) VALUES ($name)';
          const getSql = 'SELECT name FROM sample_optional WHERE name = $name /* undefined callback */';
          const allSql = 'SELECT name FROM sample_optional WHERE name = ? /* undefined callback */';
          const sentinelValue = 'optional-callback-row';

          try {
            await new Promise<void>((res, rej) => {
              db.run('CREATE TABLE sample_optional (id INTEGER PRIMARY KEY, name TEXT)', (createErr) => {
                if (createErr) {
                  rej(createErr instanceof Error ? createErr : new Error(String(createErr)));
                  return;
                }
                res();
              });
            });

            db.run(insertSql, { $name: sentinelValue }, undefined);
            db.get(getSql, { $name: sentinelValue }, undefined);
            db.all(allSql, sentinelValue, undefined);

            await new Promise<void>((res, rej) => {
              db.get(
                'SELECT name FROM sample_optional WHERE name = $name',
                { $name: sentinelValue },
                (queryErr, row) => {
                  if (queryErr) {
                    rej(queryErr instanceof Error ? queryErr : new Error(String(queryErr)));
                    return;
                  }
                  expect(row).toEqual({ name: sentinelValue });
                  res();
                },
              );
            });

            const runCall = recordedCalls.find(
              (call) => call.method === 'run' && call.sql === insertSql,
            );
            expect(runCall).toBeDefined();
            expect(runCall?.args).toEqual([{ name: sentinelValue }]);

            const getCall = recordedCalls.find(
              (call) => call.method === 'get' && call.sql === getSql,
            );
            expect(getCall).toBeDefined();
            expect(getCall?.args).toEqual([{ name: sentinelValue }]);

            const allCall = recordedCalls.find(
              (call) => call.method === 'all' && call.sql === allSql,
            );
            expect(allCall).toBeDefined();
            expect(allCall?.args).toEqual([sentinelValue]);

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
          } finally {
            prepareSpy.mockRestore();
          }
        });
      });
    });
  });
});
