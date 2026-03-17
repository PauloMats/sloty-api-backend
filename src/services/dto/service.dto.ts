import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCatalogServiceDto {
  @ApiProperty({ example: 'Corte Masculino' })
  @IsString()
  @MaxLength(140)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 45 })
  @IsInt()
  @Min(5)
  durationMinutes!: number;

  @ApiProperty({ example: 4500 })
  @IsInt()
  @Min(0)
  priceCents!: number;

  @ApiProperty({ example: 'BRL' })
  @IsString()
  currency!: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  bufferBeforeMinutes?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  bufferAfterMinutes?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCatalogServiceDto extends PartialType(CreateCatalogServiceDto) {}
