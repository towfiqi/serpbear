#!/bin/sh
sequelize-cli db:migrate --env production || npx sequelize-cli db:migrate --env production
exec "$@"
