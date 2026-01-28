#!/bin/bash
set -e
set -u

# Script to create multiple PostgreSQL databases with pgvector extension
# Usage: Set POSTGRES_MULTIPLE_DATABASES environment variable with comma-separated database names

function create_database() {
    local database=$1
    echo "Creating database '$database' with pgvector extension..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
        CREATE DATABASE $database;
        \c $database;
        CREATE EXTENSION IF NOT EXISTS vector;
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
        GRANT ALL PRIVILEGES ON DATABASE $database TO $POSTGRES_USER;
EOSQL
    echo "Database '$database' created successfully!"
}

if [ -n "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
    echo "Creating multiple databases: $POSTGRES_MULTIPLE_DATABASES"
    for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
        create_database $db
    done
    echo "All databases created successfully!"
else
    echo "POSTGRES_MULTIPLE_DATABASES not set, skipping additional database creation"
fi

# Enable pgvector extension in default database
echo "Enabling pgvector extension in main database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS vector;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
EOSQL

echo "PostgreSQL initialization complete!"
