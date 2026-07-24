import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto, AcceptInvitationDto } from './dto/invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { AuthService } from '../auth/auth.service';

@Controller('invitations')
export class InvitationsController {
  constructor(
    private readonly invitationsService: InvitationsService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitationsService.create(
      req.tenantId,
      dto.email,
      dto.role,
      req.user.memberId,
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
  async accept(
    @Param('token') token: string,
    @Body() dto: AcceptInvitationDto,
  ) {
    const result = await this.invitationsService.accept(
      token,
      dto.name,
      dto.password,
    );

    // Reuse AuthService's token signing so this JWT has exactly the same
    // shape (memberId, tokenVersion) that jwt.strategy.ts requires. Hand
    // rolling a separate sign() call here previously produced a token that
    // would compile fine but fail on the very next authenticated request.
    const { access_token } = this.authService.signToken({
      userId: result.user.id,
      memberId: result.member.id,
      tenantId: result.member.tenantId,
      role: result.member.role,
      tokenVersion: result.member.tokenVersion,
    });

    const { passwordHash, ...safeUser } = result.user;
    return {
      access_token,
      user: safeUser,
      tenant: result.tenant,
      member: result.member,
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
