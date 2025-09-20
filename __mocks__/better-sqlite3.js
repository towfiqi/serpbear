const normalizeBindings = (params) => {
  if (Array.isArray(params)) {
    return params;
  }
  if (params && typeof params === 'object') {
    return params;
  }
  if (typeof params !== 'undefined') {
    return [params];
  }
  return [];
};

const readValueFromBindings = (bindings, index, key) => {
  if (Array.isArray(bindings)) {
    return bindings[index];
  }

  if (!bindings || typeof bindings !== 'object') {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(bindings, key)) {
    return bindings[key];
  }

  const prefixed = [`$${key}`, `:${key}`, `@${key}`];
  for (const candidate of prefixed) {
    if (Object.prototype.hasOwnProperty.call(bindings, candidate)) {
      return bindings[candidate];
    }
  }

  return undefined;
};

const unpackParams = (params) => {
  if (params.length === 0) {
    return undefined;
  }
  if (params.length === 1) {
    return params[0];
  }
  return params;
};

const createStatement = (driver, sql) => ({
  run(...params) {
    return driver.execute(sql, unpackParams(params));
  },
  all(...params) {
    return driver.select(sql, unpackParams(params));
  },
  get(...params) {
    const result = driver.select(sql, unpackParams(params));
    if (Array.isArray(result)) {
      return result[0];
    }
    return result;
  },
});

class MockBetterSqlite3 {
  constructor(filename, options = {}) {
    this.filename = filename;
    this.options = options;
    this.closed = false;
    this.tables = new Map();
  }

  prepare(sql) {
    return createStatement(this, sql);
  }

  exec(sql) {
    this.execute(sql);
  }

  close() {
    this.closed = true;
  }

  ensureTable(tableName) {
    if (!this.tables.has(tableName)) {
      this.tables.set(tableName, []);
    }
    return this.tables.get(tableName);
  }

  execute(sql, params) {
    const trimmed = sql.trim();

    const createMatch = /^CREATE\s+TABLE\s+(\w+)/i.exec(trimmed);
    if (createMatch) {
      const tableName = createMatch[1];
      this.ensureTable(tableName);
      return { changes: 0 };
    }

    const insertMatch = /^INSERT\s+INTO\s+(\w+)/i.exec(trimmed);
    if (insertMatch) {
      const tableName = insertMatch[1];
      const table = this.ensureTable(tableName);
      const columnsMatch = trimmed.match(/\(([^)]+)\)/);
      const columns = columnsMatch ? columnsMatch[1].split(',').map((col) => col.trim().replace(/^[$@:]/, '')) : [];
      const normalizedParams = normalizeBindings(params);
      const row = {};

      columns.forEach((col, index) => {
        const cleanName = col.replace(/[`'"\\]/g, '');
        row[cleanName] = readValueFromBindings(normalizedParams, index, cleanName);
      });

      if (!columns.length) {
        row.value = params;
      }

      if (typeof row.id === 'undefined') {
        row.id = table.length + 1;
      }

      table.push(row);
      return { changes: 1, lastInsertRowid: row.id };
    }

    return { changes: 0 };
  }

  select(sql) {
    const trimmed = sql.trim();
    const selectMatch = /^SELECT\s+(.+)\s+FROM\s+(\w+)/i.exec(trimmed);
    if (!selectMatch) {
      return [];
    }

    const columns = selectMatch[1].split(',').map((col) => col.trim());
    const tableName = selectMatch[2];
    const table = this.ensureTable(tableName);

    if (columns.length === 1 && columns[0] === '*') {
      return table.map((row) => ({ ...row }));
    }

    return table.map((row) => {
      const result = {};
      columns.forEach((col) => {
        const cleanName = col.replace(/[`'"\\]/g, '');
        result[cleanName] = row[cleanName];
      });
      return result;
    });
  }
}

module.exports = MockBetterSqlite3;
module.exports.default = MockBetterSqlite3;
