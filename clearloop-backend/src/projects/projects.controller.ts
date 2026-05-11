import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { ProjectsService } from './project.service';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Request() req: any, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.tenantId, dto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.projectsService.findAll(req.tenantId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.projectsService.findOne(req.tenantId, id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(req.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.projectsService.remove(req.tenantId, id);
  }

  @Post(':id/members')
  @Roles('ADMIN', 'MANAGER')
  addMember(
    @Request() req: any,
    @Param('id') projectId: string,
    @Body('userId') userId: string,
  ) {
    return this.projectsService.addMember(req.tenantId, projectId, userId);
  }

  @Delete(':id/members/:userId')
  @Roles('ADMIN', 'MANAGER')
  removeMember(
    @Request() req: any,
    @Param('id') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.projectsService.removeMember(req.tenantId, projectId, userId);
  }
}
