#!/bin/sh

# This script is used by the compose file as an entrypoint proxy for the api container.
# Waits for postgres and redis to be available before running any following startup commands.

set -e

pg_host=$1
pg_port=$2
redis_host=$3
redis_port=$4
shift 4
cmd="$@"

echo "Entrypoint script for $NODE_ENV"

# Wait for Postgres
echo "Waiting for Postgres at $pg_host:$pg_port..."
until pg_isready -h "$pg_host" -p "$pg_port"; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done
echo "Postgres is up"

# Wait for Redis
echo "Waiting for Redis at $redis_host:$redis_port..."
until node -e "
  const net = require('net');
  const client = net.createConnection({host: '$redis_host', port: $redis_port}, () => {
    client.end();
    process.exit(0);
  });
  client.on('error', () => process.exit(1));
  setTimeout(() => process.exit(1), 2000);
" 2>/dev/null; do
  echo "Redis is unavailable - sleeping"
  sleep 1
done
echo "Redis is up"

echo "Running any sequelize migrations/seeders..."
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
