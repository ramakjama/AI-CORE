import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Kafka, Producer } from 'kafkajs';
import { CreatePolicyDto, UpdatePolicyDto, RenewPolicyDto, EndorsePolicyDto, CancelPolicyDto, PolicyStatus } from '../dto/create-policy.dto';

@Injectable()
export class PolicyService {
  private readonly logger = new Logger(PolicyService.name);
  private readonly prisma: PrismaClient;
  private readonly kafkaProducer: Producer;

  constructor() {
    this.prisma = new PrismaClient();
    
    const kafka = new Kafka({
      clientId: 'ait-policy-manager',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
    });
    
    this.kafkaProducer = kafka.producer();
    this.kafkaProducer.connect();
  }

  async create(createPolicyDto: CreatePolicyDto, userId: string) {
    this.logger.log(`Creating new policy for client ${createPolicyDto.clientId}`);

    try {
      const client = await this.prisma.party.findUnique({
        where: { id: createPolicyDto.clientId }
      });

      if (!client) {
        throw new NotFoundException(`Client ${createPolicyDto.clientId} not found`);
      }

      const product = await this.prisma.product.findUnique({
        where: { id: createPolicyDto.productId }
      });

      if (!product) {
        throw new NotFoundException(`Product ${createPolicyDto.productId} not found`);
      }

      const policyNumber = await this.generatePolicyNumber(createPolicyDto.type);

      const policy = await this.prisma.policy.create({
        data: {
          policyNumber,
          partyId: createPolicyDto.clientId,
          productId: createPolicyDto.productId,
          type: createPolicyDto.type,
          status: PolicyStatus.DRAFT,
          effectiveDate: createPolicyDto.effectiveDate,
          expirationDate: createPolicyDto.expirationDate,
          totalPremium: createPolicyDto.totalPremium,
          agentId: createPolicyDto.agentId,
          notes: createPolicyDto.notes,
          riskData: createPolicyDto.riskData as any,
          coverages: {
            create: createPolicyDto.coverages.map(cov => ({
              name: cov.name,
              sumInsured: cov.sumInsured,
              premium: cov.premium,
              deductible: cov.deductible,
              description: cov.description
            }))
          },
          createdBy: userId,
          updatedBy: userId
        },
        include: {
          coverages: true,
          party: true,
          product: true
        }
      });

      await this.publishEvent('entity.policy.created', {
        policyId: policy.id,
        policyNumber: policy.policyNumber,
        clientId: createPolicyDto.clientId,
        type: createPolicyDto.type,
        totalPremium: createPolicyDto.totalPremium,
        createdBy: userId,
        timestamp: new Date().toISOString()
      });

      this.logger.log(`Policy ${policy.policyNumber} created successfully`);
      return policy;
    } catch (error) {
      this.logger.error(`Error creating policy: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(filters?: { status?: PolicyStatus; type?: string; clientId?: string; agentId?: string }) {
    const where: any = {};
    
    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;
    if (filters?.clientId) where.partyId = filters.clientId;
    if (filters?.agentId) where.agentId = filters.agentId;

    return await this.prisma.policy.findMany({
      where,
      include: {
        coverages: true,
        party: true,
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const policy = await this.prisma.policy.findUnique({
      where: { id },
      include: {
        coverages: true,
        party: true,
        product: true,
        claims: true,
        endorsements: true
      }
    });

    if (!policy) {
      throw new NotFoundException(`Policy ${id} not found`);
    }

    return policy;
  }

  async update(id: string, updatePolicyDto: UpdatePolicyDto, userId: string) {
    await this.findOne(id);

    const updated = await this.prisma.policy.update({
      where: { id },
      data: {
        status: updatePolicyDto.status,
        totalPremium: updatePolicyDto.totalPremium,
        notes: updatePolicyDto.notes,
        riskData: updatePolicyDto.riskData as any,
        updatedBy: userId,
        updatedAt: new Date()
      },
      include: {
        coverages: true,
        party: true,
        product: true
      }
    });

    await this.publishEvent('entity.policy.updated', {
      policyId: id,
      changes: updatePolicyDto,
      updatedBy: userId,
      timestamp: new Date().toISOString()
    });

    return updated;
  }

  private async generatePolicyNumber(type: string): Promise<string> {
    const prefix = type.substring(0, 3).toUpperCase();
    const year = new Date().getFullYear();
    
    const lastPolicy = await this.prisma.policy.findFirst({
      where: {
        policyNumber: {
          startsWith: `${prefix}-${year}-`
        }
      },
      orderBy: { policyNumber: 'desc' }
    });

    let sequence = 1;
    if (lastPolicy) {
      const lastSequence = parseInt(lastPolicy.policyNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    const paddedSequence = String(sequence).padStart(6, '0');
    return `${prefix}-${year}-${paddedSequence}`;
  }

  private async publishEvent(topic: string, payload: any) {
    try {
      await this.kafkaProducer.send({
        topic,
        messages: [{ key: payload.policyId, value: JSON.stringify(payload) }]
      });
    } catch (error) {
      this.logger.error(`Error publishing Kafka event: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    await this.kafkaProducer.disconnect();
    await this.prisma.$disconnect();
  }
}
