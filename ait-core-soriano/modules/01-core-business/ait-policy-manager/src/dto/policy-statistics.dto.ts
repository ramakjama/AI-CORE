import { ApiProperty } from '@nestjs/swagger';

export class PolicyStatisticsDto {
  @ApiProperty({ description: 'Total de pólizas' })
  totalPolicies: number;

  @ApiProperty({ description: 'Pólizas activas' })
  activePolicies: number;

  @ApiProperty({ description: 'Pólizas suspendidas' })
  suspendedPolicies: number;

  @ApiProperty({ description: 'Pólizas canceladas' })
  cancelledPolicies: number;

  @ApiProperty({ description: 'Pólizas expiradas' })
  expiredPolicies: number;

  @ApiProperty({ description: 'Pólizas próximas a vencer (30 días)' })
  expiringPolicies: number;

  @ApiProperty({ description: 'Prima total anual' })
  totalAnnualPremium: number;

  @ApiProperty({ description: 'Prima promedio' })
  averagePremium: number;

  @ApiProperty({ description: 'Suma asegurada total' })
  totalSumInsured: number;

  @ApiProperty({ description: 'Desglose por tipo de póliza' })
  byType: Record<string, {
    count: number;
    totalPremium: number;
    averagePremium: number;
  }>;

  @ApiProperty({ description: 'Desglose por estado' })
  byStatus: Record<string, number>;

  @ApiProperty({ description: 'Top 10 agentes por número de pólizas' })
  topAgents: Array<{
    agentId: string;
    agentName: string;
    policyCount: number;
    totalPremium: number;
  }>;

  @ApiProperty({ description: 'Renovaciones del mes' })
  monthlyRenewals: number;

  @ApiProperty({ description: 'Nuevas pólizas del mes' })
  monthlyNewPolicies: number;

  @ApiProperty({ description: 'Cancelaciones del mes' })
  monthlyCancellations: number;

  @ApiProperty({ description: 'Tasa de renovación (%)' })
  renewalRate: number;

  @ApiProperty({ description: 'Tasa de cancelación (%)' })
  cancellationRate: number;
}

export class CustomerPolicyStatisticsDto {
  @ApiProperty({ description: 'ID del cliente' })
  customerId: string;

  @ApiProperty({ description: 'Nombre del cliente' })
  customerName: string;

  @ApiProperty({ description: 'Total de pólizas del cliente' })
  totalPolicies: number;

  @ApiProperty({ description: 'Pólizas activas del cliente' })
  activePolicies: number;

  @ApiProperty({ description: 'Prima total anual del cliente' })
  totalAnnualPremium: number;

  @ApiProperty({ description: 'Antigüedad como cliente (años)' })
  customerTenure: number;

  @ApiProperty({ description: 'Última fecha de renovación' })
  lastRenewalDate?: Date;

  @ApiProperty({ description: 'Próxima fecha de vencimiento' })
  nextExpirationDate?: Date;

  @ApiProperty({ description: 'Historial de reclamaciones' })
  claimsHistory: {
    totalClaims: number;
    approvedClaims: number;
    totalPaidAmount: number;
  };
}
