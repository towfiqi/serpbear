#!/bin/sh
sequelize-cli db:migrate --env production
exec "$@"