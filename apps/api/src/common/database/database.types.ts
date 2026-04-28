import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '@hris/db';

export type DrizzleDB = NodePgDatabase<typeof schema>;

export const DATABASE_SERVICE = Symbol('DATABASE_SERVICE');

export interface IDatabaseService {
  /** Tenant-scoped connection via Drizzle query builder. */
  withTenant<T>(tenantId: string, fn: (db: DrizzleDB) => Promise<T>): Promise<T>;
  /** Tenant-scoped raw parameterised query — avoids Drizzle schema type imports in callers. */
  queryWithTenant<T extends Record<string, unknown>>(
    tenantId: string,
    sql: string,
    params?: unknown[],
  ): Promise<T[]>;
  /** Unscoped connection for system operations (tenant creation, migrations). */
  readonly system: DrizzleDB;
}
