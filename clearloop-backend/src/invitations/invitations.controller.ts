import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto, AcceptInvitationDto } from './dto/invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { JwtService } from '@nestjs/jwt';

@Controller('invitations')
export class InvitationsController {
  constructor(
    private readonly invitationsService: InvitationsService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateInvitationDto) {
    return this.invitationsService.create(
      req.tenantId,
      dto.email,
      dto.role,
      req.user.userId,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  list(@Request() req: AuthenticatedRequest) {
    return this.invitationsService.list(req.tenantId);
  }

  @Get('validate/:token')
  validate(@Param('token') token: string) {
    return this.invitationsService.validate(token);
  }

  @Post('accept/:token')
  async accept(@Param('token') token: string, @Body() dto: AcceptInvitationDto) {
    const result = await this.invitationsService.accept(token, dto.name, dto.password);
    
    // Generate JWT token
    const access_token = this.jwtService.sign({
      sub: result.user.id,
      tenantId: result.user.tenantId,
      role: result.user.role,
    });

    return {
      access_token,
      user: result.user,
      tenant: result.tenant,
    };
  }

  @Post(':id/resend')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  resend(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.invitationsService.resend(req.tenantId, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  cancel(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.invitationsService.cancel(req.tenantId, id);
  }
}
