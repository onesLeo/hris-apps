import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac } from 'node:crypto';
import type { IFileStorageService, StoredFile } from './storage.types';
import { normalizeStorageKey } from './storage.utils';

type S3StorageConfig = {
  endpoint: URL;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string | null;
  forcePathStyle: boolean;
};

@Injectable()
export class S3CompatibleStorageService implements IFileStorageService {
  private readonly config: S3StorageConfig;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('FILE_STORAGE_ENDPOINT');
    const bucket = this.configService.get<string>('FILE_STORAGE_BUCKET');
    const accessKeyId = this.configService.get<string>('FILE_STORAGE_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('FILE_STORAGE_SECRET_ACCESS_KEY');

    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error('S3 storage is not configured. Set FILE_STORAGE_ENDPOINT, FILE_STORAGE_BUCKET, FILE_STORAGE_ACCESS_KEY_ID, and FILE_STORAGE_SECRET_ACCESS_KEY.');
    }

    this.config = {
      endpoint: new URL(endpoint),
      region: this.configService.get<string>('FILE_STORAGE_REGION') ?? 'us-east-1',
      bucket,
      accessKeyId,
      secretAccessKey,
      sessionToken: this.configService.get<string>('FILE_STORAGE_SESSION_TOKEN') ?? null,
      forcePathStyle: parseBoolean(this.configService.get<string>('FILE_STORAGE_FORCE_PATH_STYLE'), true),
    };
  }

  async save(storageKey: string, content: Buffer): Promise<StoredFile> {
    const safeKey = normalizeStorageKey(storageKey);
    const response = await this.request('PUT', safeKey, content);
    await assertOk(response, `store ${storageKey}`);
    return { storageKey: safeKey, location: `s3://${this.config.bucket}/${safeKey}` };
  }

  async read(storageKey: string): Promise<Buffer> {
    const response = await this.request('GET', normalizeStorageKey(storageKey));
    await assertOk(response, `read ${storageKey}`);
    return Buffer.from(await response.arrayBuffer());
  }

  async delete(storageKey: string): Promise<void> {
    const response = await this.request('DELETE', normalizeStorageKey(storageKey));
    await assertOk(response, `delete ${storageKey}`);
  }

  private async request(method: 'GET' | 'PUT' | 'DELETE', storageKey: string, body?: Buffer): Promise<Response> {
    const url = this.resolveUrl(storageKey);
    const payload = body ?? Buffer.alloc(0);
    const payloadHash = sha256Hex(payload);
    const now = new Date();
    const amzDate = formatAmzDate(now);
    const dateStamp = amzDate.slice(0, 8);
    const canonicalHeaders = buildCanonicalHeaders(url, amzDate, payloadHash, this.config.sessionToken);
    const signedHeaders = buildSignedHeaders(this.config.sessionToken);
    const canonicalRequest = [
      method,
      canonicalUri(url.pathname),
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');
    const credentialScope = `${dateStamp}/${this.config.region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      sha256Hex(Buffer.from(canonicalRequest, 'utf8')),
    ].join('\n');
    const signature = hmacHex(
      getSignatureKey(this.config.secretAccessKey, dateStamp, this.config.region, 's3'),
      stringToSign,
    );

    const headers = new Headers({
      host: url.host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      authorization: [
        'AWS4-HMAC-SHA256',
        `Credential=${this.config.accessKeyId}/${credentialScope}`,
        `SignedHeaders=${signedHeaders}`,
        `Signature=${signature}`,
      ].join(', '),
    });

    if (this.config.sessionToken) {
      headers.set('x-amz-security-token', this.config.sessionToken);
    }

    if (method === 'PUT') {
      headers.set('content-length', String(payload.byteLength));
    }

    const requestInit: RequestInit = {
      method,
      headers,
    };

    if (method === 'PUT') {
      requestInit.body = payload;
    }

    return fetch(url, requestInit);
  }

  private resolveUrl(storageKey: string): URL {
    const keyPath = canonicalUri(normalizeStorageKey(storageKey));
    if (this.config.forcePathStyle) {
      const url = new URL(this.config.endpoint.toString());
      url.pathname = joinUrlPath(this.config.endpoint.pathname, this.config.bucket, keyPath);
      return url;
    }

    const url = new URL(this.config.endpoint.toString());
    url.hostname = `${this.config.bucket}.${url.hostname}`;
    url.pathname = joinUrlPath(this.config.endpoint.pathname, keyPath);
    return url;
  }
}

async function assertOk(response: Response, action: string): Promise<void> {
  if (response.ok) {
    return;
  }

  const details = await safeReadBody(response);
  throw new Error(`Failed to ${action}: ${response.status} ${response.statusText}${details ? ` - ${details}` : ''}`);
}

async function safeReadBody(response: Response): Promise<string> {
  try {
    return (await response.text()).trim();
  } catch {
    return '';
  }
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function formatAmzDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function sha256Hex(content: Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

function hmacHex(key: Buffer | string, content: string): string {
  return createHmac('sha256', key).update(content).digest('hex');
}

function getSignatureKey(secretKey: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
  const kDate = createHmac('sha256', `AWS4${secretKey}`).update(dateStamp).digest();
  const kRegion = createHmac('sha256', kDate).update(regionName).digest();
  const kService = createHmac('sha256', kRegion).update(serviceName).digest();
  return createHmac('sha256', kService).update('aws4_request').digest();
}

function buildCanonicalHeaders(url: URL, amzDate: string, payloadHash: string, sessionToken: string | null): string {
  const headers: Array<[string, string]> = [
    ['host', url.host],
    ['x-amz-content-sha256', payloadHash],
    ['x-amz-date', amzDate],
  ];

  if (sessionToken) {
    headers.push(['x-amz-security-token', sessionToken]);
  }

  return headers
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value.trim()}\n`)
    .join('');
}

function buildSignedHeaders(sessionToken: string | null): string {
  const headers = ['host', 'x-amz-content-sha256', 'x-amz-date'];
  if (sessionToken) {
    headers.push('x-amz-security-token');
  }
  return headers.sort().join(';');
}

function canonicalUri(pathname: string): string {
  const trimmed = pathname.replace(/^\/+/, '');
  if (!trimmed) {
    return '/';
  }

  return `/${trimmed
    .split('/')
    .map((segment) => encodeURIComponent(segment).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`))
    .join('/')}`;
}

function joinUrlPath(basePath: string, ...segments: string[]): string {
  const parts = [basePath, ...segments]
    .flatMap((segment) => segment.split('/'))
    .filter((segment) => segment.length > 0);

  return `/${parts.join('/')}`;
}
