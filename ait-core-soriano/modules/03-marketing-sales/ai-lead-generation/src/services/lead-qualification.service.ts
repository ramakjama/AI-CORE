import { Injectable } from '@nestjs/common';

@Injectable()
export class LeadQualificationService {
  async qualifyLead(lead: any): Promise<{ status: string; reason: string }> {
    if (lead.score >= 80) {
      return { status: 'Hot', reason: 'High score and strong fit' };
    } else if (lead.score >= 60) {
      return { status: 'Warm', reason: 'Good potential' };
    } else if (lead.score >= 40) {
      return { status: 'Cold', reason: 'Needs nurturing' };
    }
    return { status: 'Unqualified', reason: 'Low fit' };
  }
}
