import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateUploadUrlDto } from './dto/upload.dto';
import { UploadsService } from './uploads.service';

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presign')
  createPresignedUpload(@Body() dto: CreateUploadUrlDto) {
    return this.uploadsService.createPresignedUpload(dto);
  }
}
