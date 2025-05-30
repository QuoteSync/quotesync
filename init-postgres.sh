#!/bin/bash
set -e

# Create user and database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE USER quotesync_user WITH PASSWORD 'supersecretpassword';
    CREATE DATABASE quotesync;
    GRANT ALL PRIVILEGES ON DATABASE quotesync TO quotesync_user;
    ALTER DATABASE quotesync OWNER TO quotesync_user;
EOSQL

# Create PostGIS extensions
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "quotesync" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS postgis;
    CREATE EXTENSION IF NOT EXISTS postgis_topology;
    CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
    CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;
EOSQL 