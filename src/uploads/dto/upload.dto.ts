import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches, MaxLength } from 'class-validator';

export class CreateUploadUrlDto {
  @ApiProperty({ example: 'logo.png' })
  @IsString()
  @MaxLength(180)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/, {
    message:
      'fileName must contain only letters, numbers, dots, underscores, and hyphens.',
  })
  fileName!: string;

  @ApiProperty({ example: 'image/png' })
  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType!: string;
}
