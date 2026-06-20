import { Injectable, NotImplementedException } from '@nestjs/common';
import { CreateUploadUrlDto } from './dto/upload.dto';

@Injectable()
export class UploadsService {
  createPresignedUpload(_dto: CreateUploadUrlDto) {
    void _dto;
    throw new NotImplementedException({
      code: 'UPLOAD_PROVIDER_NOT_CONFIGURED',
      message:
        'Object storage must be configured before uploads can be enabled.',
    });
  }
}
