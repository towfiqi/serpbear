const createStatement = (driver, sql) => ({
  run(params) {
    return driver.execute(sql, params);
  },
  all(params) {
    return driver.select(sql, params);
  },
  get(params) {
    const result = driver.select(sql, params);
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
      const normalizedParams = params && typeof params === 'object' ? params : {};
      const row = {};

      columns.forEach((col) => {
        const cleanName = col.replace(/[`'"\\]/g, '');
        row[cleanName] = normalizedParams[cleanName];
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
