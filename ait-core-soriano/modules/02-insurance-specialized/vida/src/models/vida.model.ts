import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsNotEmpty, IsNumber, IsString, IsEnum, IsDate, Min, Max } from 'class-validator';

export enum TipoSeguroVida {
  VIDA_ENTERA = 'vida_entera',
  VIDA_TEMPORAL = 'vida_temporal',
  VIDA_RIESGO = 'vida_riesgo',
  VIDA_AHORRO = 'vida_ahorro',
  MIXTO = 'mixto'
}

export enum EstadoPolizaVida {
  VIGENTE = 'vigente',
  SUSPENDIDA = 'suspendida',
  ANULADA = 'anulada',
  VENCIDA = 'vencida',
  RESCATADA = 'rescatada'
}

@Entity('seguros_vida')
export class SeguroVida {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  numeroPoliza: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  tomadorId: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  aseguradoId: string;

  @Column('simple-array', { nullable: true })
  beneficiariosIds: string[];

  @Column({
    type: 'enum',
    enum: TipoSeguroVida,
    default: TipoSeguroVida.VIDA_TEMPORAL
  })
  @IsEnum(TipoSeguroVida)
  tipoSeguro: TipoSeguroVida;

  @Column('decimal', { precision: 12, scale: 2 })
  @IsNumber()
  @Min(6000)
  @Max(1000000)
  capitalAsegurado: number;

  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  primaPeriodica: number;

  @Column({ default: 'anual' })
  @IsString()
  periodicidadPago: string; // mensual, trimestral, semestral, anual

  @Column()
  @IsDate()
  fechaInicio: Date;

  @Column()
  @IsDate()
  fechaVencimiento: Date;

  @Column({
    type: 'enum',
    enum: EstadoPolizaVida,
    default: EstadoPolizaVida.VIGENTE
  })
  @IsEnum(EstadoPolizaVida)
  estado: EstadoPolizaVida;

  @Column('json', { nullable: true })
  coberturas: {
    fallecimiento: boolean;
    invalidez_permanente: boolean;
    invalidez_absoluta: boolean;
    dependencia: boolean;
    enfermedades_graves: boolean;
    accidentes: boolean;
  };

  @Column('json', { nullable: true })
  datosAsegurado: {
    edad: number;
    sexo: string;
    profesion: string;
    fumador: boolean;
    deportes_riesgo: boolean;
    antecedentes_medicos: string[];
  };

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  valorRescate: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  provision_matematica: number;

  @Column({ nullable: true })
  @IsString()
  companiaNombre: string;

  @Column({ nullable: true })
  @IsString()
  mediadorId: string;

  @Column('text', { nullable: true })
  observaciones: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export class CreateSeguroVidaDto {
  @IsNotEmpty()
  @IsString()
  numeroPoliza: string;

  @IsNotEmpty()
  @IsString()
  tomadorId: string;

  @IsNotEmpty()
  @IsString()
  aseguradoId: string;

  @IsEnum(TipoSeguroVida)
  tipoSeguro: TipoSeguroVida;

  @IsNumber()
  @Min(6000)
  @Max(1000000)
  capitalAsegurado: number;

  @IsNumber()
  primaPeriodica: number;

  @IsString()
  periodicidadPago: string;

  @IsDate()
  fechaInicio: Date;

  @IsDate()
  fechaVencimiento: Date;

  coberturas: any;
  datosAsegurado: any;
  beneficiariosIds?: string[];
  companiaNombre?: string;
  mediadorId?: string;
  observaciones?: string;
}
