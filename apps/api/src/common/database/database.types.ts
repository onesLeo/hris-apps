import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

// Untyped drizzle instance — schema is not imported here to avoid the
// @hris/db path alias being rewritten to a .ts relative path in the
// compiled output. When typed query builder usage is needed in a specific
// module, that module should inject its own schema-typed connection.
export type DrizzleDB = NodePgDatabase<Record<string, never>>;

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
