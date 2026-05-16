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
import type { AddMemberDto, UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('projects')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.tenantId, dto);
  }

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.projectsService.findAll(req.tenantId);
  }

  @Get(':id')
  findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.projectsService.findOne(req.tenantId, id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(req.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.projectsService.remove(req.tenantId, id);
  }

  @Post(':id/members')
  @Roles('ADMIN', 'MANAGER')
  addMember(
    @Request() req: AuthenticatedRequest,
    @Param('id') projectId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.projectsService.addMember(req.tenantId, projectId, dto.userId);
  }

  @Delete(':id/members/:userId')
  @Roles('ADMIN', 'MANAGER')
  removeMember(
    @Request() req: AuthenticatedRequest,
    @Param('id') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.projectsService.removeMember(req.tenantId, projectId, userId);
  }
}
