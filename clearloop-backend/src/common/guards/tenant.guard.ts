import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.tenantId) {
      throw new UnauthorizedException('Tenant not found in user context');
    }
    request.tenantId = user?.tenantId;
    return true;
  }
}
