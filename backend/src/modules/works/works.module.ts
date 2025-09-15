import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorksService } from './works.service';
import { WorksController } from './works.controller';
import { Work } from './entities/work.entity';
import { Accommodation } from './entities/accommodation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Work, Accommodation])],
  controllers: [WorksController],
  providers: [WorksService],
  exports: [WorksService],
})
export class WorksModule {}