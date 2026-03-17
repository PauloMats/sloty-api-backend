import { ConfigService } from '@nestjs/config';
import { CreateUploadUrlDto } from './dto/upload.dto';
export declare class UploadsService {
    private readonly configService;
    constructor(configService: ConfigService);
    createPresignedUpload(dto: CreateUploadUrlDto): {
        provider: string;
        objectKey: string;
        method: string;
        url: string;
        headers: {
            'content-type': string;
        };
        expiresInSeconds: number;
    };
}
