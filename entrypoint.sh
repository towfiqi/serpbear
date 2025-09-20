#!/bin/sh
set -eu
set -o pipefail 2>/dev/null || true

prepare_data_dir() {
  mkdir -p ./data
}

run_migrations() {
  echo "Running database migrations..."
  node <<'NODE'
const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');

async function run() {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './data/database.sqlite',
    logging: false,
  });

  try {
    const umzug = new Umzug({
      migrations: { glob: 'database/migrations/*.js' },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize }),
      logger: undefined,
    });

    await umzug.up();
  } finally {
    await sequelize.close();
  }
}

run().catch((error) => {
  console.error('Database migration failed:', error);
  process.exit(1);
});
NODE
}

start_cron() {
  echo "Starting background cron worker..."
  node ./cron.js &
}

prepare_data_dir
run_migrations
start_cron

echo "Starting application: $*"
exec "$@"
