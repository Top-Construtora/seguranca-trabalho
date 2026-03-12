import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export const databaseConfig = (): TypeOrmModuleOptions => {
  // Se tivermos uma DATABASE_URL, usar ela (padrão Supabase)
  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false, // Nunca use true em produção/Supabase
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false,
      } : false,
      connectTimeoutMS: 60000,
      extra: {
        max: 10, // máximo de conexões no pool
        min: 2, // mínimo de conexões mantidas abertas
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      },
    };
  }

  // Senão, usar configuração manual
  return {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false, // Nunca use true em produção/Supabase
    logging: process.env.NODE_ENV === 'development',
    ssl: process.env.DB_HOST === 'localhost' ? false : {
      rejectUnauthorized: false,
    },
    extra: {
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    },
  };
};

// Export AppDataSource for direct repository access in services
export const AppDataSource = new DataSource(databaseConfig() as any);