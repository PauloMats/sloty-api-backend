import { CreateUploadUrlDto } from './dto/upload.dto';
import { UploadsService } from './uploads.service';
export declare class UploadsController {
    private readonly uploadsService;
    constructor(uploadsService: UploadsService);
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
