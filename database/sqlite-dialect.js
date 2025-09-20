const path = require('path');
const { EventEmitter } = require('events');
const BetterSqlite3 = require('better-sqlite3');

const OPEN_READONLY = 0x01;
const OPEN_READWRITE = 0x02;
const OPEN_CREATE = 0x04;
const DEFAULT_FLAGS = OPEN_READWRITE + OPEN_CREATE;

function normalizeCallback(fn) {
  if (typeof fn === 'function') {
    return fn;
  }
  return () => {};
}

function normalizeParams(params) {
  if (params === null || params === undefined) {
    return undefined;
  }
  return params;
}

function hasFlag(value, flag) {
  if (typeof value !== 'number') {
    return false;
  }
  return Math.floor(value / flag) % 2 === 1;
}

function normalizeNamedBindings(params) {
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return params;
  }
  const normalized = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof key === 'string' && key.length > 0 && ['$', '@', ':'].includes(key[0])) {
      normalized[key.slice(1)] = value;
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}

function applyStatement(stmt, method, params) {
  const normalized = normalizeParams(params);
  if (normalized === undefined) {
    return stmt[method]();
  }
  if (Array.isArray(normalized)) {
    return stmt[method](...normalized);
  }
  return stmt[method](normalized);
}

class Database extends EventEmitter {
  constructor(filename, mode, callback) {
    super();
    const flags = typeof mode === 'number' ? mode : DEFAULT_FLAGS;
    this.filename = filename;
    this.open = false;
    this.modeFlags = flags;
    this.driver = null;
    const cb = normalizeCallback(typeof mode === 'function' ? mode : callback);
    try {
      const options = {
        readonly: hasFlag(flags, OPEN_READONLY) && !hasFlag(flags, OPEN_READWRITE),
        fileMustExist: !hasFlag(flags, OPEN_CREATE),
      };
      this.driver = new BetterSqlite3(filename, options);
      this.open = true;
      setImmediate(() => {
        this.emit('open');
        cb.call(this, null);
      });
    } catch (error) {
      setImmediate(() => cb.call(this, error));
    }
  }

  serialize(callback) {
    if (typeof callback === 'function') {
      try {
        const result = callback();
        if (result && typeof result.then === 'function') {
          result.catch((err) => {
            setImmediate(() => {
              throw err;
            });
          });
        }
      } catch (error) {
        setImmediate(() => {
          throw error;
        });
      }
    }
    return this;
  }

  parallelize(callback) {
    return this.serialize(callback);
  }

  configure() {
    return this;
  }

  run(sql, ...params) {
    return this.executeInternal('run', sql, ...params);
  }

  all(sql, ...params) {
    return this.executeInternal('all', sql, ...params);
  }

  get(sql, ...params) {
    return this.executeInternal('get', sql, ...params);
  }

  exec(sql, callback) {
    const cb = normalizeCallback(callback);
    try {
      this.driver.exec(sql);
      setImmediate(() => cb.call(this, null));
    } catch (error) {
      setImmediate(() => cb.call(this, error));
    }
    return this;
  }

  close(callback) {
    const cb = normalizeCallback(callback);
    try {
      if (this.driver) {
        this.driver.close();
      }
      this.open = false;
      setImmediate(() => cb.call(this, null));
    } catch (error) {
      setImmediate(() => cb.call(this, error));
    }
    return this;
  }

  executeInternal(method, sql, ...args) {
    let cb;
    if (args.length > 0 && typeof args[args.length - 1] === 'function') {
      cb = args.pop();
    }
    let bindings;
    if (args.length === 1) {
      [bindings] = args;
    } else if (args.length > 1) {
      bindings = args;
    }

    const finalCallback = normalizeCallback(cb);
    const preparedBindings = normalizeNamedBindings(bindings);
    const context = {
      database: this,
      sql,
      lastID: undefined,
      changes: 0,
    };

    try {
      const statement = this.driver.prepare(sql);
      let result;
      if (method === 'run') {
        const info = applyStatement(statement, 'run', preparedBindings);
        if (info && typeof info.lastInsertRowid !== 'undefined') {
          const rowId = info.lastInsertRowid;
          context.lastID = Number(rowId);
        }
        context.changes = info ? info.changes || 0 : 0;
      } else if (method === 'all') {
        result = applyStatement(statement, 'all', preparedBindings);
        context.changes = Array.isArray(result) ? result.length : 0;
      } else if (method === 'get') {
        result = applyStatement(statement, 'get', preparedBindings);
        context.changes = result ? 1 : 0;
      } else {
        result = applyStatement(statement, method, preparedBindings);
      }
      setImmediate(() => finalCallback.call(context, null, result));
    } catch (error) {
      setImmediate(() => finalCallback.call(context, error));
    }

    return this;
  }
}

const cached = {
  objects: Object.create(null),
  Database(file, a, b) {
    if (!file || file === ':memory:') {
      return new Database(file, a, b);
    }
    const resolved = path.resolve(file);
    if (!this.objects[resolved]) {
      this.objects[resolved] = new Database(resolved, a, b);
    } else {
      const db = this.objects[resolved];
      let callback = null;
      if (typeof a === 'function') {
        callback = a;
      } else if (typeof b === 'function') {
        callback = b;
      }
      if (callback) {
        const wrapped = callback.bind(db, null);
        if (db.open) {
          setImmediate(wrapped);
        } else {
          db.once('open', wrapped);
        }
      }
    }
    return this.objects[resolved];
  },
};

const sqlite = {
  Database,
  OPEN_READONLY,
  OPEN_READWRITE,
  OPEN_CREATE,
  cached,
  verbose() {
    return sqlite;
  },
};

module.exports = sqlite;
module.exports.default = sqlite;
module.exports.Database = Database;
module.exports.OPEN_READONLY = OPEN_READONLY;
module.exports.OPEN_READWRITE = OPEN_READWRITE;
module.exports.OPEN_CREATE = OPEN_CREATE;
module.exports.cached = cached;
module.exports.verbose = sqlite.verbose;
