/**
 * Opportunity Service
 * Handles sales opportunities, quotes, forecasting, and pipeline management
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Opportunity,
  OpportunityStage,
  OpportunityProduct,
  Quote,
  QuoteLineItem,
  SalesForecast
} from '../types';

/**
 * Create opportunity data
 */
export interface CreateOpportunityData {
  name: string;
  description?: string;
  accountId?: string;
  accountName?: string;
  contactId?: string;
  contactName?: string;
  leadId?: string;
  stage?: OpportunityStage;
  probability?: number;
  amount?: number;
  currency?: string;
  closeDate?: Date;
  ownerId: string;
  ownerName?: string;
  teamMembers?: string[];
  primaryCampaignId?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
}

/**
 * Update opportunity data
 */
export interface UpdateOpportunityData {
  name?: string;
  description?: string;
  accountId?: string;
  accountName?: string;
  contactId?: string;
  contactName?: string;
  stage?: OpportunityStage;
  probability?: number;
  amount?: number;
  currency?: string;
  closeDate?: Date;
  ownerId?: string;
  ownerName?: string;
  teamMembers?: string[];
  forecastCategory?: 'pipeline' | 'best_case' | 'commit' | 'closed';
  customFields?: Record<string, unknown>;
  tags?: string[];
}

/**
 * Product addition data
 */
export interface AddProductData {
  productId: string;
  productName: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  description?: string;
  notes?: string;
}

/**
 * Quote creation data
 */
export interface CreateQuoteData {
  name?: string;
  expirationDays?: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  taxRate?: number;
  shipping?: number;
  terms?: string;
  notes?: string;
  contactId?: string;
  contactName?: string;
  contactEmail?: string;
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
}

/**
 * Stage probability mapping
 */
const STAGE_PROBABILITIES: Record<OpportunityStage, number> = {
  [OpportunityStage.PROSPECTING]: 10,
  [OpportunityStage.QUALIFICATION]: 20,
  [OpportunityStage.NEEDS_ANALYSIS]: 30,
  [OpportunityStage.VALUE_PROPOSITION]: 40,
  [OpportunityStage.DECISION_MAKERS]: 50,
  [OpportunityStage.PROPOSAL]: 60,
  [OpportunityStage.NEGOTIATION]: 80,
  [OpportunityStage.CLOSED_WON]: 100,
  [OpportunityStage.CLOSED_LOST]: 0
};

export class OpportunityService {
  private opportunities: Map<string, Opportunity> = new Map();
  private products: Map<string, OpportunityProduct[]> = new Map();
  private quotes: Map<string, Quote[]> = new Map();
  private quoteCounter = 1000;

  /**
   * Create a new opportunity
   */
  async create(opportunityData: CreateOpportunityData): Promise<Opportunity> {
    const now = new Date();
    const stage = opportunityData.stage || OpportunityStage.PROSPECTING;

    const opportunity: Opportunity = {
      id: uuidv4(),
      name: opportunityData.name,
      description: opportunityData.description,
      accountId: opportunityData.accountId,
      accountName: opportunityData.accountName,
      contactId: opportunityData.contactId,
      contactName: opportunityData.contactName,
      leadId: opportunityData.leadId,
      stage,
      probability: opportunityData.probability ?? STAGE_PROBABILITIES[stage],
      forecastCategory: this.determineForecastCategory(
        stage,
        opportunityData.probability ?? STAGE_PROBABILITIES[stage]
      ),
      amount: opportunityData.amount || 0,
      currency: opportunityData.currency || 'USD',
      closeDate: opportunityData.closeDate || new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      createdDate: now,
      ownerId: opportunityData.ownerId,
      ownerName: opportunityData.ownerName,
      teamMembers: opportunityData.teamMembers,
      isClosed: false,
      primaryCampaignId: opportunityData.primaryCampaignId,
      customFields: opportunityData.customFields || {},
      tags: opportunityData.tags || [],
      createdAt: now,
      updatedAt: now
    };

    this.opportunities.set(opportunity.id, opportunity);
    this.products.set(opportunity.id, []);
    this.quotes.set(opportunity.id, []);

    return opportunity;
  }

  /**
   * Update an existing opportunity
   */
  async update(id: string, changes: UpdateOpportunityData): Promise<Opportunity> {
    const opportunity = this.opportunities.get(id);
    if (!opportunity) {
      throw new Error(`Opportunity not found: ${id}`);
    }

    const updatedOpportunity: Opportunity = {
      ...opportunity,
      ...changes,
      updatedAt: new Date()
    };

    // Track stage change
    if (changes.stage && changes.stage !== opportunity.stage) {
      updatedOpportunity.lastStageChangeDate = new Date();

      // Auto-update probability if not explicitly set
      if (changes.probability === undefined) {
        updatedOpportunity.probability = STAGE_PROBABILITIES[changes.stage];
      }
    }

    // Update forecast category
    updatedOpportunity.forecastCategory = this.determineForecastCategory(
      updatedOpportunity.stage,
      updatedOpportunity.probability
    );

    this.opportunities.set(id, updatedOpportunity);

    return updatedOpportunity;
  }

  /**
   * Get an opportunity by ID
   */
  async get(id: string): Promise<Opportunity | null> {
    const opportunity = this.opportunities.get(id);
    if (opportunity) {
      // Include products and quotes
      opportunity.products = this.products.get(id);
      opportunity.quotes = this.quotes.get(id);
    }
    return opportunity || null;
  }

  /**
   * Add a product to an opportunity
   */
  async addProduct(
    oppId: string,
    productData: AddProductData
  ): Promise<OpportunityProduct> {
    const opportunity = this.opportunities.get(oppId);
    if (!opportunity) {
      throw new Error(`Opportunity not found: ${oppId}`);
    }

    // Calculate total price
    let totalPrice = productData.quantity * productData.unitPrice;
    if (productData.discount) {
      if (productData.discountType === 'percentage') {
        totalPrice = totalPrice * (1 - productData.discount / 100);
      } else {
        totalPrice = totalPrice - productData.discount;
      }
    }

    const now = new Date();

    const product: OpportunityProduct = {
      id: uuidv4(),
      opportunityId: oppId,
      productId: productData.productId,
      productName: productData.productName,
      productCode: productData.productCode,
      quantity: productData.quantity,
      unitPrice: productData.unitPrice,
      discount: productData.discount,
      discountType: productData.discountType,
      totalPrice,
      description: productData.description,
      notes: productData.notes,
      createdAt: now,
      updatedAt: now
    };

    const existingProducts = this.products.get(oppId) || [];
    existingProducts.push(product);
    this.products.set(oppId, existingProducts);

    // Update opportunity amount
    await this.recalculateOpportunityAmount(oppId);

    return product;
  }

  /**
   * Remove a product from an opportunity
   */
  async removeProduct(oppId: string, productId: string): Promise<boolean> {
    const existingProducts = this.products.get(oppId) || [];
    const filteredProducts = existingProducts.filter((p) => p.id !== productId);

    if (filteredProducts.length === existingProducts.length) {
      return false;
    }

    this.products.set(oppId, filteredProducts);
    await this.recalculateOpportunityAmount(oppId);

    return true;
  }

  /**
   * Update product quantity or price
   */
  async updateProduct(
    oppId: string,
    productId: string,
    changes: Partial<AddProductData>
  ): Promise<OpportunityProduct> {
    const existingProducts = this.products.get(oppId) || [];
    const productIndex = existingProducts.findIndex((p) => p.id === productId);

    if (productIndex === -1) {
      throw new Error(`Product not found: ${productId}`);
    }

    const existingProduct = existingProducts[productIndex];
    if (!existingProduct) {
      throw new Error(`Product not found: ${productId}`);
    }

    const quantity = changes.quantity ?? existingProduct.quantity;
    const unitPrice = changes.unitPrice ?? existingProduct.unitPrice;
    const discount = changes.discount ?? existingProduct.discount;
    const discountType = changes.discountType ?? existingProduct.discountType;

    let totalPrice = quantity * unitPrice;
    if (discount) {
      if (discountType === 'percentage') {
        totalPrice = totalPrice * (1 - discount / 100);
      } else {
        totalPrice = totalPrice - discount;
      }
    }

    const updatedProduct: OpportunityProduct = {
      ...existingProduct,
      ...changes,
      quantity,
      unitPrice,
      totalPrice,
      updatedAt: new Date()
    };

    existingProducts[productIndex] = updatedProduct;
    this.products.set(oppId, existingProducts);

    await this.recalculateOpportunityAmount(oppId);

    return updatedProduct;
  }

  /**
   * Update opportunity stage
   */
  async updateStage(oppId: string, stage: OpportunityStage): Promise<Opportunity> {
    const opportunity = this.opportunities.get(oppId);
    if (!opportunity) {
      throw new Error(`Opportunity not found: ${oppId}`);
    }

    // Validate stage transition
    if (opportunity.isClosed) {
      throw new Error('Cannot change stage of closed opportunity');
    }

    const updatedOpportunity: Opportunity = {
      ...opportunity,
      stage,
      probability: STAGE_PROBABILITIES[stage],
      lastStageChangeDate: new Date(),
      isClosed: stage === OpportunityStage.CLOSED_WON || stage === OpportunityStage.CLOSED_LOST,
      isWon: stage === OpportunityStage.CLOSED_WON,
      updatedAt: new Date()
    };

    updatedOpportunity.forecastCategory = this.determineForecastCategory(
      stage,
      updatedOpportunity.probability
    );

    this.opportunities.set(oppId, updatedOpportunity);

    return updatedOpportunity;
  }

  /**
   * Set close date
   */
  async setCloseDate(oppId: string, date: Date): Promise<Opportunity> {
    return this.update(oppId, { closeDate: date });
  }

  /**
   * Calculate probability based on various factors
   */
  async calculateProbability(oppId: string): Promise<number> {
    const opportunity = this.opportunities.get(oppId);
    if (!opportunity) {
      throw new Error(`Opportunity not found: ${oppId}`);
    }

    // Base probability from stage
    let probability = STAGE_PROBABILITIES[opportunity.stage];

    // Adjust based on days until close
    const daysUntilClose = Math.ceil(
      (new Date(opportunity.closeDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilClose < 0) {
      // Past close date, reduce probability
      probability *= 0.7;
    } else if (daysUntilClose <= 7) {
      // Very close to closing, increase if in late stage
      if (opportunity.stage === OpportunityStage.NEGOTIATION) {
        probability *= 1.1;
      }
    }

    // Adjust based on activity recency
    if (opportunity.lastActivityDate) {
      const daysSinceActivity = Math.ceil(
        (Date.now() - new Date(opportunity.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceActivity > 30) {
        probability *= 0.8;
      } else if (daysSinceActivity > 14) {
        probability *= 0.9;
      }
    }

    // Cap probability
    probability = Math.min(95, Math.max(5, probability));

    // Update opportunity
    await this.update(oppId, { probability: Math.round(probability) });

    return Math.round(probability);
  }

  /**
   * Create a quote for an opportunity
   */
  async createQuote(oppId: string, quoteData?: CreateQuoteData): Promise<Quote> {
    const opportunity = this.opportunities.get(oppId);
    if (!opportunity) {
      throw new Error(`Opportunity not found: ${oppId}`);
    }

    const products = this.products.get(oppId) || [];
    const now = new Date();

    // Generate quote number
    this.quoteCounter++;
    const quoteNumber = `Q-${this.quoteCounter.toString().padStart(6, '0')}`;

    // Calculate totals
    let subtotal = products.reduce((sum, p) => sum + p.totalPrice, 0);

    // Apply quote-level discount
    let discountAmount = 0;
    if (quoteData?.discount) {
      if (quoteData.discountType === 'percentage') {
        discountAmount = subtotal * (quoteData.discount / 100);
      } else {
        discountAmount = quoteData.discount;
      }
    }

    const afterDiscount = subtotal - discountAmount;

    // Calculate tax
    const taxAmount = quoteData?.taxRate ? afterDiscount * (quoteData.taxRate / 100) : 0;

    // Calculate total
    const total = afterDiscount + taxAmount + (quoteData?.shipping || 0);

    // Create line items from products
    const lineItems: QuoteLineItem[] = products.map((product, index) => ({
      id: uuidv4(),
      quoteId: '', // Will be updated
      productId: product.productId,
      productName: product.productName,
      description: product.description,
      quantity: product.quantity,
      unitPrice: product.unitPrice,
      discount: product.discount,
      discountType: product.discountType,
      totalPrice: product.totalPrice,
      sortOrder: index
    }));

    const expirationDays = quoteData?.expirationDays || 30;

    const quote: Quote = {
      id: uuidv4(),
      opportunityId: oppId,
      name: quoteData?.name || `${opportunity.name} - Quote`,
      quoteNumber,
      status: 'draft',
      subtotal,
      discount: discountAmount,
      discountType: quoteData?.discountType,
      tax: taxAmount,
      taxRate: quoteData?.taxRate,
      shipping: quoteData?.shipping,
      total,
      currency: opportunity.currency,
      lineItems: lineItems.map((li) => ({ ...li, quoteId: '' })),
      issueDate: now,
      expirationDate: new Date(now.getTime() + expirationDays * 24 * 60 * 60 * 1000),
      contactId: quoteData?.contactId || opportunity.contactId,
      contactName: quoteData?.contactName || opportunity.contactName,
      contactEmail: quoteData?.contactEmail,
      billingStreet: quoteData?.billingStreet,
      billingCity: quoteData?.billingCity,
      billingState: quoteData?.billingState,
      billingPostalCode: quoteData?.billingPostalCode,
      billingCountry: quoteData?.billingCountry,
      terms: quoteData?.terms,
      notes: quoteData?.notes,
      createdAt: now,
      updatedAt: now
    };

    // Update line items with quote ID
    quote.lineItems = quote.lineItems.map((li) => ({ ...li, quoteId: quote.id }));

    const existingQuotes = this.quotes.get(oppId) || [];
    existingQuotes.push(quote);
    this.quotes.set(oppId, existingQuotes);

    // Set as active quote
    await this.update(oppId, { activeQuoteId: quote.id } as unknown as UpdateOpportunityData);

    return quote;
  }

  /**
   * Update quote status
   */
  async updateQuoteStatus(
    oppId: string,
    quoteId: string,
    status: Quote['status']
  ): Promise<Quote> {
    const existingQuotes = this.quotes.get(oppId) || [];
    const quoteIndex = existingQuotes.findIndex((q) => q.id === quoteId);

    if (quoteIndex === -1) {
      throw new Error(`Quote not found: ${quoteId}`);
    }

    const existingQuote = existingQuotes[quoteIndex];
    if (!existingQuote) {
      throw new Error(`Quote not found: ${quoteId}`);
    }

    const updatedQuote: Quote = {
      ...existingQuote,
      status,
      updatedAt: new Date()
    };

    if (status === 'accepted') {
      updatedQuote.acceptedDate = new Date();
    }

    existingQuotes[quoteIndex] = updatedQuote;
    this.quotes.set(oppId, existingQuotes);

    return updatedQuote;
  }

  /**
   * Mark opportunity as won
   */
  async wonOpportunity(oppId: string): Promise<Opportunity> {
    const opportunity = this.opportunities.get(oppId);
    if (!opportunity) {
      throw new Error(`Opportunity not found: ${oppId}`);
    }

    const updatedOpportunity: Opportunity = {
      ...opportunity,
      stage: OpportunityStage.CLOSED_WON,
      probability: 100,
      forecastCategory: 'closed',
      isClosed: true,
      isWon: true,
      lastStageChangeDate: new Date(),
      updatedAt: new Date()
    };

    this.opportunities.set(oppId, updatedOpportunity);

    return updatedOpportunity;
  }

  /**
   * Mark opportunity as lost
   */
  async lostOpportunity(oppId: string, reason: string, competitor?: string): Promise<Opportunity> {
    const opportunity = this.opportunities.get(oppId);
    if (!opportunity) {
      throw new Error(`Opportunity not found: ${oppId}`);
    }

    const updatedOpportunity: Opportunity = {
      ...opportunity,
      stage: OpportunityStage.CLOSED_LOST,
      probability: 0,
      forecastCategory: 'closed',
      isClosed: true,
      isWon: false,
      lossReason: reason,
      competitor,
      lastStageChangeDate: new Date(),
      updatedAt: new Date()
    };

    this.opportunities.set(oppId, updatedOpportunity);

    return updatedOpportunity;
  }

  /**
   * Get sales forecast for a user and period
   */
  async getForecast(
    userId: string,
    period: { start: Date; end: Date }
  ): Promise<SalesForecast> {
    const userOpportunities = Array.from(this.opportunities.values()).filter((opp) => {
      return (
        opp.ownerId === userId &&
        new Date(opp.closeDate) >= period.start &&
        new Date(opp.closeDate) <= period.end
      );
    });

    // Calculate amounts by forecast category
    let pipeline = 0;
    let bestCase = 0;
    let commit = 0;
    let closed = 0;

    const byStage: Record<string, { count: number; value: number }> = {};

    for (const opp of userOpportunities) {
      // By forecast category
      switch (opp.forecastCategory) {
        case 'pipeline':
          pipeline += opp.amount;
          break;
        case 'best_case':
          bestCase += opp.amount;
          break;
        case 'commit':
          commit += opp.amount;
          break;
        case 'closed':
          if (opp.isWon) {
            closed += opp.amount;
          }
          break;
      }

      // By stage
      if (!byStage[opp.stage]) {
        byStage[opp.stage] = { count: 0, value: 0 };
      }
      const stageData = byStage[opp.stage];
      if (stageData) {
        stageData.count++;
        stageData.value += opp.amount;
      }
    }

    // Predict close amount (weighted by probability)
    const predictedClose = userOpportunities
      .filter((opp) => !opp.isClosed)
      .reduce((sum, opp) => sum + opp.amount * (opp.probability / 100), 0);

    return {
      period,
      userId,
      pipeline,
      bestCase,
      commit,
      closed,
      byStage,
      predictedClose: Math.round(predictedClose),
      confidence: 0.75 // Simplified confidence score
    };
  }

  /**
   * Get total pipeline value
   */
  async getPipelineValue(): Promise<{
    total: number;
    weighted: number;
    byStage: Record<string, { count: number; value: number; weighted: number }>;
  }> {
    const openOpportunities = Array.from(this.opportunities.values()).filter(
      (opp) => !opp.isClosed
    );

    let total = 0;
    let weighted = 0;
    const byStage: Record<string, { count: number; value: number; weighted: number }> = {};

    for (const opp of openOpportunities) {
      total += opp.amount;
      weighted += opp.amount * (opp.probability / 100);

      if (!byStage[opp.stage]) {
        byStage[opp.stage] = { count: 0, value: 0, weighted: 0 };
      }
      const stageData = byStage[opp.stage];
      if (stageData) {
        stageData.count++;
        stageData.value += opp.amount;
        stageData.weighted += opp.amount * (opp.probability / 100);
      }
    }

    return {
      total: Math.round(total),
      weighted: Math.round(weighted),
      byStage
    };
  }

  /**
   * Get opportunities by stage
   */
  async getOpportunitiesByStage(stage: OpportunityStage): Promise<Opportunity[]> {
    return Array.from(this.opportunities.values()).filter((opp) => opp.stage === stage);
  }

  /**
   * Get opportunities by owner
   */
  async getOpportunitiesByOwner(ownerId: string): Promise<Opportunity[]> {
    return Array.from(this.opportunities.values()).filter((opp) => opp.ownerId === ownerId);
  }

  /**
   * Get opportunities closing in period
   */
  async getOpportunitiesClosingInPeriod(
    start: Date,
    end: Date
  ): Promise<Opportunity[]> {
    return Array.from(this.opportunities.values()).filter((opp) => {
      const closeDate = new Date(opp.closeDate);
      return closeDate >= start && closeDate <= end && !opp.isClosed;
    });
  }

  /**
   * Get all opportunities
   */
  async getAllOpportunities(): Promise<Opportunity[]> {
    return Array.from(this.opportunities.values());
  }

  /**
   * Delete an opportunity
   */
  async delete(id: string): Promise<boolean> {
    this.products.delete(id);
    this.quotes.delete(id);
    return this.opportunities.delete(id);
  }

  /**
   * Recalculate opportunity amount from products
   */
  private async recalculateOpportunityAmount(oppId: string): Promise<void> {
    const products = this.products.get(oppId) || [];
    const totalAmount = products.reduce((sum, p) => sum + p.totalPrice, 0);

    await this.update(oppId, { amount: totalAmount });
  }

  /**
   * Determine forecast category based on stage and probability
   */
  private determineForecastCategory(
    stage: OpportunityStage,
    probability: number
  ): 'pipeline' | 'best_case' | 'commit' | 'closed' {
    if (stage === OpportunityStage.CLOSED_WON || stage === OpportunityStage.CLOSED_LOST) {
      return 'closed';
    }

    if (probability >= 80) {
      return 'commit';
    } else if (probability >= 50) {
      return 'best_case';
    }

    return 'pipeline';
  }

  /**
   * Clone an opportunity
   */
  async clone(oppId: string, newName?: string): Promise<Opportunity> {
    const opportunity = await this.get(oppId);
    if (!opportunity) {
      throw new Error(`Opportunity not found: ${oppId}`);
    }

    const clonedOpp = await this.create({
      name: newName || `${opportunity.name} (Copy)`,
      description: opportunity.description,
      accountId: opportunity.accountId,
      accountName: opportunity.accountName,
      contactId: opportunity.contactId,
      contactName: opportunity.contactName,
      stage: OpportunityStage.PROSPECTING,
      amount: opportunity.amount,
      currency: opportunity.currency,
      ownerId: opportunity.ownerId,
      ownerName: opportunity.ownerName,
      customFields: opportunity.customFields,
      tags: opportunity.tags
    });

    // Clone products
    const products = this.products.get(oppId) || [];
    for (const product of products) {
      await this.addProduct(clonedOpp.id, {
        productId: product.productId,
        productName: product.productName,
        productCode: product.productCode,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
        discount: product.discount,
        discountType: product.discountType,
        description: product.description,
        notes: product.notes
      });
    }

    return clonedOpp;
  }
}

export const opportunityService = new OpportunityService();
