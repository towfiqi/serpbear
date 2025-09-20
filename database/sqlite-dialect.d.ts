import { EventEmitter } from 'events';

declare namespace SqliteDialect {
  type Callback<T = unknown> = (error: Error | null, result?: T) => void;

  class Database extends EventEmitter {
    constructor(filename: string, mode?: number, callback?: Callback<void>);

    filename: string;

    open: boolean;

    run(sql: string, params?: unknown[] | Record<string, unknown>, callback?: Callback<void>): this;

    all<T = unknown>(sql: string, params?: unknown[] | Record<string, unknown>, callback?: Callback<T[]>): this;

    get<T = unknown>(sql: string, params?: unknown[] | Record<string, unknown>, callback?: Callback<T | undefined>): this;

    exec(sql: string, callback?: Callback<void>): this;

    close(callback?: Callback<void>): this;

    serialize<T>(callback: () => T): this;

    parallelize<T>(callback: () => T): this;

    configure(option: string, value: unknown): this;
  }

  interface Cached {
    objects: Record<string, Database>;
    Database(file: string, mode?: number | Callback<void>, callback?: Callback<void>): Database;
  }
}

declare const sqlite: {
  Database: typeof SqliteDialect.Database;
  OPEN_READONLY: number;
  OPEN_READWRITE: number;
  OPEN_CREATE: number;
  cached: SqliteDialect.Cached;
  verbose(): typeof sqlite;
};

export = sqlite;
