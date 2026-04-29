import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, type PoolClient } from 'pg';

import type { DrizzleDB, IDatabaseService } from './database.types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class DatabaseService implements IDatabaseService, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool!: Pool;
  private _system!: DrizzleDB;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const connectionString = this.config.getOrThrow<string>('DATABASE_URL');
    this.pool = new Pool({ connectionString, max: 20 });
    this._system = drizzle(this.pool);
    this.logger.log('Database pool initialised');
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
    this.logger.log('Database pool closed');
  }

  get system(): DrizzleDB {
    return this._system;
  }

  async withTenant<T>(tenantId: string, fn: (db: DrizzleDB) => Promise<T>): Promise<T> {
    return this.withTenantClient(tenantId, (client) => fn(drizzle(client)));
  }

  async queryWithTenant<T extends Record<string, unknown>>(
    tenantId: string,
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    return this.withTenantClient(tenantId, async (client) => {
      const result = await client.query<T>(sql, params);
      return result.rows;
    });
  }

  private async withTenantClient<T>(
    tenantId: string,
    fn: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    if (!UUID_RE.test(tenantId)) {
      throw new Error('Invalid tenantId format — must be a UUID');
    }

    const client = await this.pool.connect();
    try {
      // SET LOCAL (via set_config third arg = true) is transaction-scoped:
      // the config resets on COMMIT/ROLLBACK, making connection reuse safe.
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenantId]);
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
