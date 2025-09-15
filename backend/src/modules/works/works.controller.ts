import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Put,
} from '@nestjs/common';
import { WorksService } from './works.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('works')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('works')
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  @Get('accommodations')
  findAllAccommodations() {
    return this.worksService.findAllAccommodations();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createWorkDto: CreateWorkDto) {
    return this.worksService.create(createWorkDto);
  }

  @Get()
  findAll() {
    return this.worksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.worksService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateWorkDto: Partial<CreateWorkDto>) {
    return this.worksService.update(id, updateWorkDto);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN)
  toggleActive(@Param('id') id: string) {
    return this.worksService.toggleActive(id);
  }
}