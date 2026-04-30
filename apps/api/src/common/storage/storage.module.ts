import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FILE_STORAGE_SERVICE } from './storage.types';
import { LocalFileStorageService } from './local-file-storage.service';
import { S3CompatibleStorageService } from './s3-compatible-storage.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: FILE_STORAGE_SERVICE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const driver = (config.get<string>('FILE_STORAGE_DRIVER') ?? 'filesystem').trim().toLowerCase();
        if (driver === 's3' || driver === 'object') {
          return new S3CompatibleStorageService(config);
        }
        return new LocalFileStorageService(config);
      },
    },
  ],
  exports: [FILE_STORAGE_SERVICE],
})
export class StorageModule {}
