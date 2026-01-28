import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LeadEnrichmentService {
  private readonly logger = new Logger(LeadEnrichmentService.name);

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async enrichLead(leadData: { email: string; company?: string; name?: string }): Promise<any> {
    const enrichedData: any = {};

    try {
      // Clearbit enrichment
      const clearbitData = await this.enrichWithClearbit(leadData.email);
      if (clearbitData) enrichedData.clearbit = clearbitData;

      // LinkedIn profile
      if (leadData.name) {
        const linkedInProfile = await this.findLinkedInProfile(leadData.name, leadData.company);
        if (linkedInProfile) enrichedData.linkedIn = linkedInProfile;
      }

      // Company data
      if (leadData.company) {
        const companyData = await this.enrichCompanyData(leadData.company);
        if (companyData) enrichedData.company = companyData;
      }

      return enrichedData;
    } catch (error) {
      this.logger.error(`Enrichment failed: ${error.message}`);
      return {};
    }
  }

  private async enrichWithClearbit(email: string): Promise<any> {
    try {
      const apiKey = this.configService.get('CLEARBIT_API_KEY');
      const response = await firstValueFrom(
        this.httpService.get(`https://person-stream.clearbit.com/v2/combined/find?email=${email}`, {
          auth: { username: apiKey, password: '' },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.warn(`Clearbit enrichment failed: ${error.message}`);
      return null;
    }
  }

  private async findLinkedInProfile(name: string, company: string): Promise<any> {
    // Implementation for LinkedIn profile lookup
    return null;
  }

  private async enrichCompanyData(company: string): Promise<any> {
    // Implementation for company data enrichment
    return null;
  }
}
