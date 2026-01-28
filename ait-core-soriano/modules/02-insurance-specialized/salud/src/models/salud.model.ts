import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsNotEmpty, IsNumber, IsString, IsEnum, IsDate, Min, Max } from 'class-validator';

export enum ModalidadSalud {
  SIN_COPAGOS = 'sin_copagos',
  CON_COPAGOS = 'con_copagos',
  REEMBOLSO = 'reembolso',
  MIXTO = 'mixto'
}

export enum TipoCoberturaSalud {
  BASICA = 'basica',
  COMPLETA = 'completa',
  PREMIUM = 'premium',
  DENTAL = 'dental'
}

@Entity('seguros_salud')
export class SeguroSalud {
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

  @Column('simple-array')
  aseguradosIds: string[];

  @Column({
    type: 'enum',
    enum: ModalidadSalud,
    default: ModalidadSalud.SIN_COPAGOS
  })
  @IsEnum(ModalidadSalud)
  modalidad: ModalidadSalud;

  @Column({
    type: 'enum',
    enum: TipoCoberturaSalud,
    default: TipoCoberturaSalud.COMPLETA
  })
  @IsEnum(TipoCoberturaSalud)
  tipoCobertura: TipoCoberturaSalud;

  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  primaMensual: number;

  @Column()
  @IsDate()
  fechaInicio: Date;

  @Column()
  @IsDate()
  fechaVencimiento: Date;

  @Column('json')
  coberturas: {
    medicina_general: boolean;
    especialistas: boolean;
    hospitalizacion: boolean;
    urgencias: boolean;
    pruebas_diagnosticas: boolean;
    cirugia: boolean;
    maternidad: boolean;
    pediatria: boolean;
    dental: boolean;
    fisioterapia: boolean;
    psicologia: boolean;
  };

  @Column('json', { nullable: true })
  copagos: {
    consulta_especialista: number;
    pruebas_diagnosticas: number;
    urgencias: number;
    fisioterapia: number;
  };

  @Column({ nullable: true })
  @IsString()
  cuadroMedico: string; // Nacional, Provincial, Local

  @Column({ nullable: true })
  @IsString()
  companiaNombre: string;

  @Column({ default: 6 })
  periodoCarenciaMeses: number;

  @Column('text', { nullable: true })
  observaciones: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export class CreateSeguroSaludDto {
  @IsNotEmpty()
  @IsString()
  numeroPoliza: string;

  @IsNotEmpty()
  @IsString()
  tomadorId: string;

  @IsNotEmpty()
  aseguradosIds: string[];

  @IsEnum(ModalidadSalud)
  modalidad: ModalidadSalud;

  @IsEnum(TipoCoberturaSalud)
  tipoCobertura: TipoCoberturaSalud;

  @IsNumber()
  primaMensual: number;

  @IsDate()
  fechaInicio: Date;

  coberturas: any;
  copagos?: any;
  cuadroMedico?: string;
  companiaNombre?: string;
  periodoCarenciaMeses?: number;
  observaciones?: string;
}
