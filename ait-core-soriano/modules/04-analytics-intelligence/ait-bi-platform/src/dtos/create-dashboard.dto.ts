import { IsString, IsEnum, IsOptional, IsBoolean, IsArray, IsObject, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DashboardType, DashboardVisibility } from '../entities/dashboard.entity';

export class CreateDashboardDto {
  @ApiProperty({ description: 'Dashboard name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Dashboard description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: DashboardType, description: 'Dashboard type' })
  @IsEnum(DashboardType)
  type: DashboardType;

  @ApiPropertyOptional({ enum: DashboardVisibility, description: 'Dashboard visibility' })
  @IsEnum(DashboardVisibility)
  @IsOptional()
  visibility?: DashboardVisibility;

  @ApiPropertyOptional({ description: 'Dashboard layout configuration' })
  @IsObject()
  @IsOptional()
  layout?: any;

  @ApiPropertyOptional({ description: 'Dashboard filters' })
  @IsObject()
  @IsOptional()
  filters?: any;

  @ApiPropertyOptional({ description: 'Dashboard theme' })
  @IsObject()
  @IsOptional()
  theme?: any;

  @ApiPropertyOptional({ description: 'Refresh interval in seconds' })
  @IsNumber()
  @IsOptional()
  refreshInterval?: number;

  @ApiPropertyOptional({ description: 'Dashboard tags' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Dashboard permissions' })
  @IsObject()
  @IsOptional()
  permissions?: any;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: any;
}

export class UpdateDashboardDto {
  @ApiPropertyOptional({ description: 'Dashboard name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Dashboard description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: DashboardType, description: 'Dashboard type' })
  @IsEnum(DashboardType)
  @IsOptional()
  type?: DashboardType;

  @ApiPropertyOptional({ enum: DashboardVisibility, description: 'Dashboard visibility' })
  @IsEnum(DashboardVisibility)
  @IsOptional()
  visibility?: DashboardVisibility;

  @ApiPropertyOptional({ description: 'Dashboard layout configuration' })
  @IsObject()
  @IsOptional()
  layout?: any;

  @ApiPropertyOptional({ description: 'Dashboard filters' })
  @IsObject()
  @IsOptional()
  filters?: any;

  @ApiPropertyOptional({ description: 'Dashboard theme' })
  @IsObject()
  @IsOptional()
  theme?: any;

  @ApiPropertyOptional({ description: 'Refresh interval in seconds' })
  @IsNumber()
  @IsOptional()
  refreshInterval?: number;

  @ApiPropertyOptional({ description: 'Is dashboard active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Is dashboard favorite' })
  @IsBoolean()
  @IsOptional()
  isFavorite?: boolean;

  @ApiPropertyOptional({ description: 'Dashboard tags' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Dashboard permissions' })
  @IsObject()
  @IsOptional()
  permissions?: any;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: any;
}
