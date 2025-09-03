import { DataSource } from 'typeorm';
import { seedPenaltyTable } from './seeds/penalty-table.seed';
import { seedAdminUser } from './seeds/admin-user.seed';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runSeeds() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: true,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    console.log('Running seeds...');
    
    await seedPenaltyTable(dataSource);
    await seedAdminUser(dataSource);
    
    console.log('Seeds completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runSeeds();