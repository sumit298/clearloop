import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard  } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    return (await super.canActivate(context)) as boolean;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const tenant = request.query.tenant;

    return {
      state: tenant ? JSON.stringify({ tenant }) : undefined,
    };
  }
}
