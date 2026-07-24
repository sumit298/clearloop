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
import { CreateBugReportDto, UpdateBugReportDto } from './dto/bug-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { BugReportsService } from './bug-report.service';

@Controller('bug-reports')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class BugReportsController {
  constructor(private readonly bugReportsService: BugReportsService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER', 'DEVELOPER')
  create(
    @Request() req: AuthenticatedRequest,
    @Body() createBugReportDto: CreateBugReportDto,
  ) {
    return this.bugReportsService.createBugReport(
      req.tenantId,
      req.user.memberId,
      createBugReportDto,
    );
  }

  @Get()
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query('featureId') featureId?: string,
  ) {
    return this.bugReportsService.findAll(req.tenantId, featureId);
  }

  @Get(':id')
  findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.bugReportsService.findOne(req.tenantId, id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER', 'DEVELOPER')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateBugReportDto: UpdateBugReportDto,
  ) {
    return this.bugReportsService.update(
      req.tenantId,
      id,
      req.user.memberId,
      updateBugReportDto,
    );
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.bugReportsService.remove(req.tenantId, id, req.user.role);
  }
}
