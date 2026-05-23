import {
  Controller,
  Get,
  UseGuards,
  Request,
  Patch,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { WorkspaceService } from './workspace.service';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Controller('workspace')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  getCurrent(@Request() req: AuthenticatedRequest) {
    return this.workspaceService.getCurrent(req.tenantId);
  }

  @Patch()
  @Roles('ADMIN')
  update(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspaceService.update(req.tenantId, dto);
  }

  @Get('stats')
  getStats(@Request() req: AuthenticatedRequest) {
    return this.workspaceService.getStats(req.tenantId);
  }
}
