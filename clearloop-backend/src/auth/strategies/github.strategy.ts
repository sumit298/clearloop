import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID')!,
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL')!,
      scope: ['user:email'],
      passReqToCallback: true,
    });
  }

  async validate(
    request: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const { id, username, emails, displayName, photos } = profile;

    const user = {
      githubId: id,
      email: emails?.[0]?.value,
      name: displayName || username,
      githubUsername: username,
      avatarUrl: photos?.[0]?.value,
      provider: 'github',
      // Extract tenant from state parameter
      tenant: (() => {
        try {
          return request.query.state
            ? JSON.parse(request.query.state).tenant
            : null;
        } catch {
          return null;
        }
      })(),
    };

    done(null, user);
  }
}
