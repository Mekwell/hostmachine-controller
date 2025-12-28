import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';

@Injectable()
export class S3StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
      signatureVersion: 'v4',
    });
  }

  async uploadBackup(serverId: string, filePath: string): Promise<string> {
    const fileStream = fs.createReadStream(filePath);
    const fileName = `backups/${serverId}/${Date.now()}.tar.gz`;

    const params = {
      Bucket: process.env.S3_BUCKET || 'hostmachine-backups',
      Key: fileName,
      Body: fileStream,
    };

    try {
        const result = await this.s3.upload(params).promise();
        this.logger.log(`Backup uploaded to S3: ${result.Location}`);
        return result.Location;
    } catch (err: any) {
        this.logger.error(`S3 Upload failed: ${err.message}`);
        throw err;
    }
  }
}
