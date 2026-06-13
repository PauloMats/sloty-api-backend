import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsBoolean,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class WeeklyAvailabilityEntryDto {
  @ApiProperty({ example: 1, description: '0 = Sunday, 6 = Saturday' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ example: '09:00' })
  @Matches(/^\d{2}:\d{2}$/)
  startTime!: string;

  @ApiProperty({ example: '18:00' })
  @Matches(/^\d{2}:\d{2}$/)
  endTime!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SetWeeklyAvailabilityDto {
  @ApiProperty({ type: [WeeklyAvailabilityEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WeeklyAvailabilityEntryDto)
  entries!: WeeklyAvailabilityEntryDto[];
}

export class CreateBusinessClosureDto {
  @ApiProperty({ example: '2026-04-10T12:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: '2026-04-10T15:00:00.000Z' })
  @IsDateString()
  endsAt!: string;

  @ApiPropertyOptional({ example: 'Holiday maintenance' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AvailabilitySlotsQueryDto {
  @ApiProperty({ example: '2026-04-14' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;
}

export class AvailabilityRangeQueryDto {
  @ApiProperty({ example: '2026-04-14' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate!: string;

  @ApiProperty({ example: '2026-04-20' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate!: string;
}
