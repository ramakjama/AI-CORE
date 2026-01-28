import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { IsNotEmpty, IsNumber, IsString, IsEnum } from 'class-validator';

export enum TipoCobertura {
  TERCEROS = 'terceros',
  TERCEROS_AMPLIADO = 'terceros_ampliado',
  TODO_RIESGO = 'todo_riesgo',
  TODO_RIESGO_FRANQUICIA = 'todo_riesgo_franquicia'
}

@Entity('seguros_autos')
export class SeguroAutos {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  numeroPoliza: string;

  @Column()
  @IsNotEmpty()
  tomadorId: string;

  @Column()
  @IsNotEmpty()
  conductorPrincipalId: string;

  @Column()
  matricula: string;

  @Column()
  marca: string;

  @Column()
  modelo: string;

  @Column()
  añoMatriculacion: number;

  @Column('decimal', { precision: 10, scale: 2 })
  valorVehiculo: number;

  @Column({ type: 'enum', enum: TipoCobertura })
  @IsEnum(TipoCobertura)
  tipoCobertura: TipoCobertura;

  @Column('decimal', { precision: 10, scale: 2 })
  primaAnual: number;

  @Column('json')
  coberturas: {
    rc_ilimitada: boolean;
    lunas: boolean;
    robo: boolean;
    incendio: boolean;
    fenomenos_atmosfericos: boolean;
    daños_propios: boolean;
    asistencia_viaje: boolean;
    conductor_novel: boolean;
    vehiculo_sustitucion: boolean;
  };

  @Column({ default: 0 })
  bonusMalus: number; // 0 a 15

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  franquicia: number;
}

export class CreateSeguroAutosDto {
  @IsNotEmpty()
  numeroPoliza: string;

  @IsNotEmpty()
  tomadorId: string;

  @IsNotEmpty()
  conductorPrincipalId: string;

  @IsNotEmpty()
  matricula: string;

  @IsNotEmpty()
  marca: string;

  @IsNotEmpty()
  modelo: string;

  @IsNumber()
  añoMatriculacion: number;

  @IsNumber()
  valorVehiculo: number;

  @IsEnum(TipoCobertura)
  tipoCobertura: TipoCobertura;

  coberturas: any;
  bonusMalus?: number;
  franquicia?: number;
}
