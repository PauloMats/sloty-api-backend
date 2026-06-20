import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  businessId!: string;

  @ApiProperty()
  @IsString()
  serviceId!: string;

  @ApiProperty({ example: '2026-04-14T15:00:00.000Z' })
  @IsDateString()
  startAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  staffUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ example: 'app' })
  @IsOptional()
  @IsString()
  source?: string;
}

export class CancelAppointmentDto {
  @ApiPropertyOptional({ example: 'Cliente nao pode comparecer' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class AppointmentRangeQueryDto {
  @ApiProperty({ example: '2026-04-14' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate!: string;

  @ApiProperty({ example: '2026-04-20' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate!: string;
}
