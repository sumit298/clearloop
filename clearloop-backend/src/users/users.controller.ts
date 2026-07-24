import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Param,
  Patch,
  Delete,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { UserService } from './users.service';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateOwnProfileDto, UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateUserDto) {
    return this.userService.create(req.tenantId, dto);
  }

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.userService.findAll(req.tenantId);
  }

  @Get('me')
  getOwnProfile(@Request() req: AuthenticatedRequest) {
    return this.userService.findOne(req.tenantId, req.user.memberId);
  }

  @Get(':id')
  findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.userService.findOne(req.tenantId, id);
  }


  @Patch("me")
  updateOwnProfile(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateOwnProfileDto,
  ) {
    return this.userService.updateOwnProfile(
      req.tenantId,
      req.user.memberId,
      dto,
    );
  } 

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    if(id === req.user.memberId) {
      throw new ForbiddenException("Use Patch /users/me to update your own profile")
    }
    return this.userService.update(req.tenantId, id, req.user.role, dto);
  }

  @Delete(':id/deactivate')
  @Roles('ADMIN')
  deactivate(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.userService.deactiveUser(req.tenantId, id);
  }

  @Post(':id/reactivate')
  @Roles('ADMIN')
  reactivate(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.userService.reactivateUser(req.tenantId, id);
  }
}
