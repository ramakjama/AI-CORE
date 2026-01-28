import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BacklinkAnalyzerService {
  private readonly logger = new Logger(BacklinkAnalyzerService.name);

  async analyzeBacklinks(domain: string): Promise<any> {
    return {
      score: 70,
      backlinks: [],
      opportunities: [],
    };
  }
}
