import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class StartConversationDto {
  @ApiProperty()
  @IsString()
  businessId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serviceRequestId?: string;
}

export class SendMessageDto {
  @ApiProperty({ example: 'Ola, podemos alinhar os detalhes?' })
  @IsString()
  @MaxLength(2000)
  body!: string;
}
