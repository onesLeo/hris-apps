import { Inject, Injectable, Logger } from '@nestjs/common';

import { DATABASE_SERVICE, type IDatabaseService } from '../../common/database/database.types';
import type { PolicyLevel, PolicyResolutionContext, PolicyResolutionResult } from './policy.types';

type PolicyRuleRow = {
  id: string;
  level: PolicyLevel;
  entity_id: string | null;
  value_json: unknown;
  effective_from: string;
  effective_to: string | null;
};

@Injectable()
export class PolicyService {
  private readonly logger = new Logger(PolicyService.name);

  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: IDatabaseService,
  ) {}

  async resolve<T>(
    ruleKey: string,
    context: PolicyResolutionContext,
  ): Promise<PolicyResolutionResult<T>> {
    const today = new Date().toISOString().slice(0, 10);

    // Fetch all active rules for this key in one round-trip; filter in-process.
    const rows = await this.db.queryWithTenant<PolicyRuleRow>(
      context.tenantId,
      `SELECT id, level, entity_id, value_json, effective_from, effective_to
         FROM policy_rules
        WHERE rule_key = $1
          AND effective_from <= $2
          AND (effective_to IS NULL OR effective_to >= $2)`,
      [ruleKey, today],
    );

    // Walk the 5 levels from most to least specific; first match wins.
    const levels: Array<{ level: PolicyLevel; entityId: string | null }> = [
      { level: 'employee',   entityId: context.employeeId   ?? null },
      { level: 'department', entityId: context.departmentId ?? null },
      { level: 'location',   entityId: context.locationId   ?? null },
      { level: 'company',    entityId: context.tenantId },
      { level: 'system',     entityId: null },
    ];

    for (const { level, entityId } of levels) {
      const match = rows.find((r) => this.matchesLevel(r, level, entityId));
      if (match) {
        const result: PolicyResolutionResult<T> = {
          value: match.value_json as T,
          winningLevel: level,
          winningEntityId: entityId,
          context,
        };

        this.logger.debug({
          action: 'policy.resolved',
          rule: ruleKey,
          winning_level: level,
          winning_entity_id: entityId,
          context,
        });

        return result;
      }
    }

    throw new Error(
      `No policy rule found for key "${ruleKey}" in context ${JSON.stringify(context)}`,
    );
  }

  private matchesLevel(row: PolicyRuleRow, level: PolicyLevel, entityId: string | null): boolean {
    if (row.level !== level) return false;
    if (level === 'system') return true;
    return row.entity_id === entityId;
  }
}
