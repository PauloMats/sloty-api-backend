import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { BusinessStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
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
