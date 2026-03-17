import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class RegisterClientDto {
  @ApiProperty({ example: 'Ana Costa' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
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
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class LogoutDto {
  @ApiProperty()
  @IsString()
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
