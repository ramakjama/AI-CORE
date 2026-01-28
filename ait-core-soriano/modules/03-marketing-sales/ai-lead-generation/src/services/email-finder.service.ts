import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EmailFinderService {
  private readonly logger = new Logger(EmailFinderService.name);

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async findEmail(firstName: string, lastName: string, company: string): Promise<string> {
    try {
      const apiKey = this.configService.get('HUNTER_API_KEY');
      const response = await firstValueFrom(
        this.httpService.get(`https://api.hunter.io/v2/email-finder`, {
          params: {
            domain: company,
            first_name: firstName,
            last_name: lastName,
            api_key: apiKey,
          },
        }),
      );

      return response.data.data.email;
    } catch (error) {
      this.logger.error(`Email finding failed: ${error.message}`);
      return null;
    }
  }
}
