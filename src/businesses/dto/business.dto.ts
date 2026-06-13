import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { BusinessStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Max,
  Min,
} from 'class-validator';

export class CreateBusinessDto {
  @ApiProperty({ example: 'Barbearia Sloty' })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'barbearia-sloty' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'beauty' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ example: 'BR' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: 'America/Fortaleza' })
  @IsString()
  timezone!: string;

  @ApiPropertyOptional({ enum: BusinessStatus, default: BusinessStatus.ACTIVE })
  @IsOptional()
  @IsEnum(BusinessStatus)
  status: BusinessStatus = BusinessStatus.ACTIVE;
}

export class UpdateBusinessDto extends PartialType(CreateBusinessDto) {}

export class ListBusinessesQueryDto {
  @ApiPropertyOptional({ example: 'Fortaleza' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'beauty' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: -3.7319 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: -38.5267 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ example: 25, default: 25, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  radiusKm?: number;

  @ApiPropertyOptional({ example: 30, default: 50, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
