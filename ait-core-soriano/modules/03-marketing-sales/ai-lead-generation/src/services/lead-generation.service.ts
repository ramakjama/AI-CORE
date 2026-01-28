import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../entities/lead.entity';
import { LeadScoringService } from './lead-scoring.service';
import { LeadEnrichmentService } from './lead-enrichment.service';
import { LeadQualificationService } from './lead-qualification.service';
import { WebScraperService } from './web-scraper.service';
import { EmailFinderService } from './email-finder.service';

export interface LeadGenerationCriteria {
  industry?: string[];
  companySize?: string[];
  location?: string[];
  jobTitles?: string[];
  keywords?: string[];
  revenueRange?: { min: number; max: number };
}

export interface GeneratedLead {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  jobTitle: string;
  linkedInUrl?: string;
  companyWebsite?: string;
  industry: string;
  companySize: string;
  location: string;
  enrichedData?: any;
  score?: number;
  qualification?: string;
}

@Injectable()
export class LeadGenerationService {
  private readonly logger = new Logger(LeadGenerationService.name);

  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    private leadScoringService: LeadScoringService,
    private leadEnrichmentService: LeadEnrichmentService,
    private leadQualificationService: LeadQualificationService,
    private webScraperService: WebScraperService,
    private emailFinderService: EmailFinderService,
  ) {}

  async generateLeads(criteria: LeadGenerationCriteria, limit: number = 100): Promise<GeneratedLead[]> {
    this.logger.log(`Generating ${limit} leads with criteria: ${JSON.stringify(criteria)}`);

    try {
      // Multi-source lead generation
      const [linkedInLeads, apolloLeads, webLeads] = await Promise.all([
        this.generateLinkedInLeads(criteria, Math.floor(limit * 0.4)),
        this.generateApolloLeads(criteria, Math.floor(limit * 0.4)),
        this.generateWebScrapedLeads(criteria, Math.floor(limit * 0.2)),
      ]);

      const allLeads = [...linkedInLeads, ...apolloLeads, ...webLeads];

      // Enrich leads with additional data
      const enrichedLeads = await this.enrichLeads(allLeads);

      // Score and qualify leads
      const scoredLeads = await this.scoreAndQualifyLeads(enrichedLeads);

      // Save to database
      await this.saveLeads(scoredLeads);

      return scoredLeads;
    } catch (error) {
      this.logger.error(`Lead generation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async enrichLead(leadId: string): Promise<any> {
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });

    const enrichedData = await this.leadEnrichmentService.enrichLead({
      email: lead.email,
      company: lead.company,
      name: `${lead.firstName} ${lead.lastName}`,
    });

    lead.enrichedData = enrichedData;
    await this.leadRepository.save(lead);

    return enrichedData;
  }

  async scoreLead(leadId: string): Promise<number> {
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });

    const score = await this.leadScoringService.calculateLeadScore(lead);

    return score;
  }

  async qualifyLead(leadId: string): Promise<any> {
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });

    const qualification = await this.leadQualificationService.qualifyLead(lead);

    lead.qualification = qualification.status;
    lead.qualificationReason = qualification.reason;
    await this.leadRepository.save(lead);

    return qualification;
  }

  async findEmail(firstName: string, lastName: string, company: string): Promise<string> {
    return this.emailFinderService.findEmail(firstName, lastName, company);
  }

  async bulkImportLeads(leads: Partial<Lead>[]): Promise<Lead[]> {
    this.logger.log(`Bulk importing ${leads.length} leads`);

    const savedLeads = [];

    for (const leadData of leads) {
      try {
        // Check for duplicates
        const existing = await this.leadRepository.findOne({
          where: { email: leadData.email },
        });

        if (existing) {
          this.logger.warn(`Duplicate lead found: ${leadData.email}`);
          continue;
        }

        // Enrich and score
        const enrichedData = await this.leadEnrichmentService.enrichLead({
          email: leadData.email,
          company: leadData.company,
          name: `${leadData.firstName} ${leadData.lastName}`,
        });

        const lead = this.leadRepository.create({
          ...leadData,
          enrichedData,
          createdAt: new Date(),
        });

        const score = await this.leadScoringService.calculateLeadScore(lead);
        lead.score = score;

        const saved = await this.leadRepository.save(lead);
        savedLeads.push(saved);
      } catch (error) {
        this.logger.error(`Failed to import lead ${leadData.email}: ${error.message}`);
      }
    }

    return savedLeads;
  }

  async getLeadsByScore(minScore: number, maxScore: number = 100): Promise<Lead[]> {
    return this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.score >= :minScore', { minScore })
      .andWhere('lead.score <= :maxScore', { maxScore })
      .orderBy('lead.score', 'DESC')
      .getMany();
  }

  async getLeadsByQualification(qualification: string): Promise<Lead[]> {
    return this.leadRepository.find({
      where: { qualification },
      order: { score: 'DESC' },
    });
  }

  private async generateLinkedInLeads(criteria: LeadGenerationCriteria, limit: number): Promise<GeneratedLead[]> {
    this.logger.log(`Generating LinkedIn leads`);
    // Implementation with LinkedIn Sales Navigator API or web scraping
    return [];
  }

  private async generateApolloLeads(criteria: LeadGenerationCriteria, limit: number): Promise<GeneratedLead[]> {
    this.logger.log(`Generating Apollo.io leads`);
    // Implementation with Apollo.io API
    return [];
  }

  private async generateWebScrapedLeads(criteria: LeadGenerationCriteria, limit: number): Promise<GeneratedLead[]> {
    this.logger.log(`Generating web-scraped leads`);

    const leads = await this.webScraperService.scrapeLeadsFromWebsites(
      criteria.keywords || [],
      criteria.industry || [],
    );

    return leads.slice(0, limit);
  }

  private async enrichLeads(leads: GeneratedLead[]): Promise<GeneratedLead[]> {
    const enriched = [];

    for (const lead of leads) {
      try {
        const enrichedData = await this.leadEnrichmentService.enrichLead({
          email: lead.email,
          company: lead.company,
          name: `${lead.firstName} ${lead.lastName}`,
        });

        enriched.push({ ...lead, enrichedData });
      } catch (error) {
        this.logger.warn(`Failed to enrich lead ${lead.email}: ${error.message}`);
        enriched.push(lead);
      }
    }

    return enriched;
  }

  private async scoreAndQualifyLeads(leads: GeneratedLead[]): Promise<GeneratedLead[]> {
    const scored = [];

    for (const lead of leads) {
      try {
        const score = await this.leadScoringService.calculateLeadScore(lead as any);
        const qualification = await this.leadQualificationService.qualifyLead(lead as any);

        scored.push({
          ...lead,
          score,
          qualification: qualification.status,
        });
      } catch (error) {
        this.logger.warn(`Failed to score lead ${lead.email}: ${error.message}`);
        scored.push(lead);
      }
    }

    return scored;
  }

  private async saveLeads(leads: GeneratedLead[]): Promise<void> {
    for (const leadData of leads) {
      try {
        // Check for duplicates
        const existing = await this.leadRepository.findOne({
          where: { email: leadData.email },
        });

        if (existing) continue;

        const lead = this.leadRepository.create({
          ...leadData,
          createdAt: new Date(),
        });

        await this.leadRepository.save(lead);
      } catch (error) {
        this.logger.error(`Failed to save lead ${leadData.email}: ${error.message}`);
      }
    }
  }
}
