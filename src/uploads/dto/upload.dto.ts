import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateUploadUrlDto {
  @ApiProperty({ example: 'logo.png' })
  @IsString()
  fileName!: string;

  @ApiProperty({ example: 'image/png' })
  @IsString()
  contentType!: string;
}
