export const FILE_STORAGE_SERVICE = Symbol('FILE_STORAGE_SERVICE');

export type StoredFile = {
  storageKey: string;
  location: string;
};

export interface IFileStorageService {
  save(storageKey: string, content: Buffer): Promise<StoredFile>;
  read(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}
