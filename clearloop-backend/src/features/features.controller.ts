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
  Query,
} from '@nestjs/common';
import { FeaturesService } from './features.service';
import type {
  CreateFeatureDto,
  UpdateFeatureDto,
} from './dto/create-feature.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('features')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER', 'DEVELOPER')
  create(@Request() req: AuthenticatedRequest, @Body() createFeatureDto: CreateFeatureDto) {
    return this.featuresService.create(
      req.tenantId,
      req.user.userId,
      createFeatureDto,
    );
  }

  @Get()
  findAll(@Request() req: AuthenticatedRequest, @Query('projectId') projectId?: string) {
    return this.featuresService.findAll(req.tenantId, projectId);
  }

  @Get(':id')
  findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.featuresService.findOne(req.tenantId, id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER', 'DEVELOPER')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateFeatureDto: UpdateFeatureDto,
  ) {
    return this.featuresService.update(
      req.tenantId,
      req.user.userId,
      id,
      updateFeatureDto,
    );
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.featuresService.remove(req.tenantId, req.user.userId, id);
  }
}
