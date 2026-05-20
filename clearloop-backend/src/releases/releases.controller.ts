import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  CreateReleaseDto,
  UpdateReleaseDto,
  AddFeatureToReleaseDto,
  GenerateReleaseNotesDto,
} from './dto/release.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { ReleaseService } from './releases.service';

@Controller('releases')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ReleasesController {
  constructor(private readonly releasesService: ReleaseService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(
    @Request() req: AuthenticatedRequest,
    @Body() createReleaseDto: CreateReleaseDto,
  ) {
    return this.releasesService.create(
      req.tenantId,
      req.user.userId,
      createReleaseDto,
    );
  }

  @Post('generate-notes')
  @Roles('ADMIN', 'MANAGER', 'DEVELOPER')
  generateNotes(
    @Request() req: AuthenticatedRequest,
    @Body() dto: GenerateReleaseNotesDto,
  ) {
    return this.releasesService.generateReleaseNotes(req.tenantId, dto);
  }

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.releasesService.findAll(req.tenantId);
  }

  @Get(':id')
  findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.releasesService.findOne(req.tenantId, id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateReleaseDto: UpdateReleaseDto,
  ) {
    return this.releasesService.update(req.tenantId, id, updateReleaseDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.releasesService.remove(req.tenantId, id, req.user.role);
  }

  @Post(':id/features')
  @Roles('ADMIN', 'MANAGER')
  addFeature(
    @Request() req: AuthenticatedRequest,
    @Param('id') releaseId: string,
    @Body() dto: AddFeatureToReleaseDto,
  ) {
    return this.releasesService.addFeature(
      req.tenantId,
      releaseId,
      dto.featureId,
    );
  }

  @Delete(':id/features/:featureId')
  @Roles('ADMIN', 'MANAGER')
  removeFeature(
    @Request() req: AuthenticatedRequest,
    @Param('id') releaseId: string,
    @Param('featureId') featureId: string,
  ) {
    return this.releasesService.removeFeature(
      req.tenantId,
      releaseId,
      featureId,
    );
  }
}
