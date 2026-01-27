import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { ClaimsModule } from './modules/claims/claims.module';
import { FinanceModule } from './modules/finance/finance.module';
import { AIAgentsModule } from './modules/ai-agents/ai-agents.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HrModule } from './modules/hr/hr.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { LeadsModule } from './modules/leads/leads.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      context: ({ req, res }) => ({ req, res }),
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    ClientsModule,
    PoliciesModule,
    ClaimsModule,
    FinanceModule,
    AIAgentsModule,
    AnalyticsModule,
    HrModule,
    CommunicationsModule,
    DocumentsModule,
    WorkflowsModule,
    LeadsModule,
  ],
})
export class AppModule {}
