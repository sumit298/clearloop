import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenant = request.query.tenant;

    if (tenant) {
      request.query.state = JSON.stringify({ tenant });
    }

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
