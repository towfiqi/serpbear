#!/bin/sh
npx sequelize-cli db:migrate --env production
exec "$@"