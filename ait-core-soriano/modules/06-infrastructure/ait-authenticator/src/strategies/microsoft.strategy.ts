import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-microsoft';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('MICROSOFT_CLIENT_ID'),
      clientSecret: configService.get<string>('MICROSOFT_CLIENT_SECRET'),
      callbackURL: configService.get<string>('MICROSOFT_CALLBACK_URL'),
      scope: ['user.read'],
      tenant: configService.get<string>('MICROSOFT_TENANT', 'common'),
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, displayName, emails, photos } = profile;

    // Parse name (Microsoft returns displayName as "FirstName LastName")
    const nameParts = displayName?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const user = await this.authService.validateOAuthUser({
      providerId: id,
      provider: 'microsoft',
      email: emails?.[0]?.value || profile.userPrincipalName,
      firstName,
      lastName,
      avatar: photos?.[0]?.value,
    });

    done(null, user);
  }
}
