import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CreateBusinessDto } from '../../businesses/dto/business.dto';

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class RegisterClientDto {
  @ApiProperty({ example: 'Ana Costa' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'ana@example.com' })
  @Transform(({ value }: { value: unknown }) => normalizeEmail(value))
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message:
      'password must include uppercase, lowercase, number, and special character.',
  })
  password!: string;

  @ApiPropertyOptional({ example: '+55 85 99999-9999' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class RegisterBusinessDto extends RegisterClientDto {
  @ApiProperty({
    type: CreateBusinessDto,
    example: {
      name: 'Studio SLOTY',
      slug: 'studio-sloty',
      timezone: 'America/Fortaleza',
      status: 'ACTIVE',
      category: 'beauty',
      phone: '+55 85 99999-1111',
      email: 'studio@example.com',
      country: 'BR',
    },
  })
  business!: CreateBusinessDto;
}

export class LoginDto {
  @ApiProperty({ example: 'ana@example.com' })
  @Transform(({ value }: { value: unknown }) => normalizeEmail(value))
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MaxLength(128)
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @MaxLength(4096)
  refreshToken!: string;
}

export class LogoutDto {
  @ApiProperty()
  @IsString()
  @MaxLength(4096)
  refreshToken!: string;
}

export class AuthTokensDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;
}

export class AuthUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserResponseDto })
  user!: AuthUserResponseDto;

  @ApiProperty({ type: AuthTokensDto })
  tokens!: AuthTokensDto;

  @ApiPropertyOptional()
  business?: Record<string, unknown>;
}
