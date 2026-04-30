import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { IFileStorageService, StoredFile } from './storage.types';
import { resolveStoragePath } from './storage.utils';

@Injectable()
export class LocalFileStorageService implements IFileStorageService {
  private readonly rootDir: string;

  constructor(private readonly config: ConfigService) {
    this.rootDir = this.config.get<string>('FILE_STORAGE_ROOT') ?? join(process.cwd(), 'storage');
  }

  async save(storageKey: string, content: Buffer): Promise<StoredFile> {
    const absolutePath = resolveStoragePath(this.rootDir, storageKey);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content);
    return { storageKey, location: absolutePath };
  }

  async read(storageKey: string): Promise<Buffer> {
    return readFile(resolveStoragePath(this.rootDir, storageKey));
  }

  async delete(storageKey: string): Promise<void> {
    await unlink(resolveStoragePath(this.rootDir, storageKey)).catch(() => undefined);
  }
}
