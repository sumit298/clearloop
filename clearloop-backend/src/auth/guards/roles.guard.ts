import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

export const Roles =
  (...roles: string[]) =>
  (target: any, key?: string, descriptor?: any) => {
    Reflect.defineMetadata('roles', roles, descriptor?.value ?? target);
  };

export const AllowSelf =
  () => (target: any, key?: string, descriptor?: any) => {
    Reflect.defineMetadata('allowSelf', true, descriptor?.value ?? target);
  };
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    const allowSelf = this.reflector.get<boolean>(
      'allowSelf',
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) throw new ForbiddenException('No user found in request');
    if (!roles && !allowSelf) return true; // No roles means it's public

    if (allowSelf) {
      const resourceUserId = request.params.id;
      if (resourceUserId === user.userId) {
        return true;
      }
    }

    if (roles && roles.includes(user.role)) {
      return true;
    }

    throw new ForbiddenException('Insufficient permissions');
  }
}
