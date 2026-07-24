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
import { CommentsService } from './comments.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { CreateCommentsDto, UpdateCommentsDto } from './dto/comments.dto';

@Controller('comments')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(
    @Request() req: AuthenticatedRequest,
    @Body() createCommentDto: CreateCommentsDto,
  ) {
    return this.commentsService.create(
      req.tenantId,
      req.user.memberId,
      createCommentDto,
    );
  }

  @Get()
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query('featureId') featureId?: string,
    @Query('bugReportId') bugReportId?: string,
  ) {
    if (featureId) {
      return this.commentsService.findByFeature(req.tenantId, featureId);
    }
    if (bugReportId) {
      return this.commentsService.findByBugReport(req.tenantId, bugReportId);
    }
    return { message: 'Please provide featureId or bugReportId query parameter' };
  }

  @Get(':id')
  findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.commentsService.findOne(req.tenantId, id);
  }

  @Patch(':id')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentsDto,
  ) {
    return this.commentsService.update(
      req.tenantId,
      id,
      req.user.memberId,
      req.user.role,
      updateCommentDto,
    );
  }

  @Delete(':id')
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.commentsService.remove(
      req.tenantId,
      id,
      req.user.memberId,
      req.user.role,
    );
  }
}
