import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsNotEmpty, IsNumber, IsString, IsEnum } from 'class-validator';

export enum TipoVivienda {
  PISO = 'piso',
  CHALET = 'chalet',
  ADOSADO = 'adosado',
  DUPLEX = 'duplex',
  ATICO = 'atico'
}

@Entity('seguros_hogar')
export class SeguroHogar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  numeroPoliza: string;

  @Column()
  @IsNotEmpty()
  tomadorId: string;

  @Column({ type: 'enum', enum: TipoVivienda })
  @IsEnum(TipoVivienda)
  tipoVivienda: TipoVivienda;

  @Column('decimal', { precision: 12, scale: 2 })
  @IsNumber()
  valorContinente: number;

  @Column('decimal', { precision: 12, scale: 2 })
  @IsNumber()
  valorContenido: number;

  @Column('decimal', { precision: 10, scale: 2 })
  superficie: number;

  @Column()
  direccion: string;

  @Column()
  codigoPostal: string;

  @Column()
  poblacion: string;

  @Column()
  provincia: string;

  @Column('decimal', { precision: 10, scale: 2 })
  primaAnual: number;

  @Column('json')
  coberturas: {
    incendio: boolean;
    agua: boolean;
    robo: boolean;
    cristales: boolean;
    rc_familiar: boolean;
    responsabilidad_civil: number;
    asistencia_hogar: boolean;
    electrodomesticos: boolean;
  };

  @Column('json', { nullable: true })
  medidasSeguridad: {
    alarma: boolean;
    puerta_blindada: boolean;
    rejas: boolean;
    cerradura_seguridad: boolean;
  };

  @Column({ nullable: true })
  añoConstruccion: number;

  @Column({ default: false })
  viviendaHabitual: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export class CreateSeguroHogarDto {
  @IsNotEmpty()
  numeroPoliza: string;

  @IsNotEmpty()
  tomadorId: string;

  @IsEnum(TipoVivienda)
  tipoVivienda: TipoVivienda;

  @IsNumber()
  valorContinente: number;

  @IsNumber()
  valorContenido: number;

  @IsNumber()
  superficie: number;

  @IsNotEmpty()
  direccion: string;

  @IsNotEmpty()
  codigoPostal: string;

  @IsNotEmpty()
  poblacion: string;

  @IsNotEmpty()
  provincia: string;

  coberturas: any;
  medidasSeguridad?: any;
  añoConstruccion?: number;
  viviendaHabitual?: boolean;
}
