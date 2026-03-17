import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { CreateUploadUrlDto } from './dto/upload.dto';

@Injectable()
export class UploadsService {
  constructor(private readonly configService: ConfigService) {}

  createPresignedUpload(dto: CreateUploadUrlDto) {
    const objectKey = `uploads/${randomUUID()}-${dto.fileName}`;
    const appUrl = this.configService.getOrThrow<string>('APP_URL');

    return {
      provider: 'object-storage-placeholder',
      objectKey,
      method: 'PUT',
      url: `${appUrl}/signed-upload-placeholder/${objectKey}`,
      headers: {
        'content-type': dto.contentType,
      },
      expiresInSeconds: 900,
    };
  }
}
