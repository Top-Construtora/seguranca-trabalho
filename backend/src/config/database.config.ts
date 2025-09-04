import { TypeOrmModuleOptions } from '@nestjs/typeorm';

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
      acquireTimeoutMS: 60000,
      timeout: 60000,
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
  };
};