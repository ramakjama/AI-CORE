import { Module } from '@nestjs/common';
import { InsuranceResolver } from './insurance.resolver';
import { InsuranceService } from './insurance.service';

@Module({
  providers: [InsuranceResolver, InsuranceService],
})
export class InsuranceModule {}
