import path from 'path';
import type { Core } from '@strapi/strapi';

const databaseDir = __dirname;

export default ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Database => {
  const client = env('DATABASE_CLIENT', 'sqlite');

  const connections = {
    mysql: {
      connection: {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 3306),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        ssl: env.bool('DATABASE_SSL', false),
      },
      pool: { min: 2, max: 10 },
    },
    postgres: {
      connection: {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'insforge'),
        user: env('DATABASE_USERNAME', 'postgres'),
        password: env('DATABASE_PASSWORD', ''),
        ssl: env.bool('DATABASE_SSL', false),
        schema: env('DATABASE_SCHEMA', 'public'),
      },
      pool: { min: 1, max: 5 },
    },
    sqlite: {
      connection: {
        filename: path.join(databaseDir, '..', '..', env('DATABASE_FILENAME', '.tmp/data.db')),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      client,
      ...connections[client as keyof typeof connections],
    },
    settings: {
      forceMigration: env.bool('DATABASE_FORCE_MIGRATION', true),
      runMigrations: env.bool('DATABASE_RUN_MIGRATIONS', true),
    },
  } as Core.Config.Database;
};
