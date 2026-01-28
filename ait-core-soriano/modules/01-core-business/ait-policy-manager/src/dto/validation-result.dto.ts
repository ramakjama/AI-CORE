import { ApiProperty } from '@nestjs/swagger';

export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export class ValidationIssue {
  @ApiProperty({ description: 'Código del error' })
  code: string;

  @ApiProperty({ description: 'Mensaje descriptivo' })
  message: string;

  @ApiProperty({ description: 'Severidad', enum: ValidationSeverity })
  severity: ValidationSeverity;

  @ApiProperty({ description: 'Campo afectado', required: false })
  field?: string;

  @ApiProperty({ description: 'Valor actual', required: false })
  currentValue?: any;

  @ApiProperty({ description: 'Valor esperado', required: false })
  expectedValue?: any;
}

export class ValidationResultDto {
  @ApiProperty({ description: 'Validación exitosa' })
  isValid: boolean;

  @ApiProperty({ description: 'Puede continuar a pesar de warnings' })
  canProceed: boolean;

  @ApiProperty({ description: 'Lista de problemas encontrados', type: [ValidationIssue] })
  issues: ValidationIssue[];

  @ApiProperty({ description: 'Número de errores' })
  errorCount: number;

  @ApiProperty({ description: 'Número de warnings' })
  warningCount: number;

  @ApiProperty({ description: 'Mensaje de resumen', required: false })
  summary?: string;

  @ApiProperty({ description: 'Datos adicionales', required: false })
  metadata?: Record<string, any>;
}
