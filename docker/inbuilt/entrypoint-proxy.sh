#!/bin/sh

# This script is used by the compose file as an entrypoint proxy for the api container.
# Waits for postgres to be available before running any following startup commands.

set -e

host=$1
port=$2
shift
shift
cmd="$@"

echo "Entrypoint script for $NODE_ENV"

until pg_isready -h "$host" -p "$port"; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Postgres is up - running any sequelize migrations/seeders..."
if [ "$NODE_ENV" != "indexing" ]; then
  echo "Running migrations"
  npx sequelize-cli db:migrate
else
  echo "Skipping migrations for indexing environment"
fi
echo "Running seeders"
npx sequelize-cli db:seed:all

echo "Proceeding to api entrypoint"
exec $cmd
