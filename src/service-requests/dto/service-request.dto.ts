import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceRequestStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressId?: string;

  @ApiProperty({ example: 'Preciso pintar uma parede da sala' })
  @IsString()
  @MaxLength(160)
  title!: string;

  @ApiProperty({ example: 'Parede com 3m x 2,6m, tinta ja comprada.' })
  @IsString()
  @MaxLength(1200)
  description!: string;

  @ApiProperty({ example: 'Fortaleza' })
  @IsString()
  @MaxLength(120)
  city!: string;

  @ApiPropertyOptional({ example: 'CE' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @ApiPropertyOptional({ example: -3.7319 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: -38.5267 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetMinCents?: number;

  @ApiPropertyOptional({ example: 25000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetMaxCents?: number;

  @ApiPropertyOptional({ example: 'BRL' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: '2026-07-01T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ListServiceRequestsQueryDto {
  @ApiPropertyOptional({ example: 'Fortaleza' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ServiceRequestStatus })
  @IsOptional()
  @IsEnum(ServiceRequestStatus)
  status?: ServiceRequestStatus;
}

export class CreateServiceProposalDto {
  @ApiProperty()
  @IsString()
  businessId!: string;

  @ApiProperty({ example: 'Consigo atender amanha de manha. Levo os materiais complementares.' })
  @IsString()
  @MaxLength(1200)
  message!: string;

  @ApiPropertyOptional({ example: 18000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedPriceCents?: number;

  @ApiPropertyOptional({ example: 180 })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDurationMinutes?: number;
}
