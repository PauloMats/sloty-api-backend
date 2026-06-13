import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateMeDto {
  @ApiPropertyOptional({ example: 'Ana Maria Costa' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: '+55 85 99999-2222' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateUserAddressDto {
  @ApiPropertyOptional({ example: 'Casa' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;

  @ApiPropertyOptional({ example: 'Ana Costa' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  recipientName?: string;

  @ApiPropertyOptional({ example: '+55 85 99999-2222' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Rua das Flores, 100' })
  @IsString()
  @MaxLength(180)
  addressLine1!: string;

  @ApiPropertyOptional({ example: 'Apto 302' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'Fortaleza' })
  @IsString()
  @MaxLength(120)
  city!: string;

  @ApiPropertyOptional({ example: 'CE' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @ApiPropertyOptional({ example: '60000-000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;

  @ApiPropertyOptional({ example: 'BR' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

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

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateUserAddressDto extends PartialType(CreateUserAddressDto) {}
