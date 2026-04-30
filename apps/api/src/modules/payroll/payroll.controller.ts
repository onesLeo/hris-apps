import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../../common/guards/roles.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { PayrollRepository } from './payroll.repository';
import { mapPayrollRunError } from './payroll-error.mapper';
import { CalculatePayrollRunItemDto } from './calculate-payroll-run-item.dto';
import { CalculatePayrollRunItemUseCase } from './calculate-payroll-run-item.use-case';
import { StartPayrollRunDto } from './start-payroll-run.dto';
import { PayrollRunError, StartPayrollRunUseCase } from './start-payroll-run.use-case';
import { FinalizePayrollRunUseCase } from './finalize-payroll-run.use-case';

@Controller('payroll')
export class PayrollController {
  constructor(
    private readonly payrollRepository: PayrollRepository,
    private readonly startPayrollRunUseCase: StartPayrollRunUseCase,
    private readonly finalizePayrollRunUseCase: FinalizePayrollRunUseCase,
    private readonly calculatePayrollRunItemUseCase: CalculatePayrollRunItemUseCase,
  ) {}

  @Post('runs')
  @Roles('hris_admin', 'payroll_manager')
  async startRun(
    @Body() body: StartPayrollRunDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const tenantId = user?.tenantId ?? '';
    const actorId = user?.userId || user?.keycloakId || '';

    try {
      const snapshot = await this.payrollRepository.loadStartSnapshot(tenantId, body.periodId, body.locationId ?? null);
      if (!snapshot.period) {
        throw new PayrollRunError('PERIOD_NOT_FOUND', `Payroll period ${body.periodId} not found`);
      }

      const startSnapshot = {
        period: snapshot.period,
        existingRun: snapshot.existingRun,
      };

      const result = this.startPayrollRunUseCase.execute(
        {
          tenantId,
          actorId,
          payrollRunId: randomUUID(),
          periodId: body.periodId,
          locationId: body.locationId ?? null,
        },
        startSnapshot,
      );

      await this.payrollRepository.saveStartResult(tenantId, result);
      return result;
    } catch (error) {
      if (error instanceof PayrollRunError) {
        throw mapPayrollRunError(error);
      }
      throw error;
    }
  }

  @Post('runs/:runId/finalise')
  @Roles('hris_admin', 'payroll_manager')
  async finaliseRun(
    @Param('runId', ParseUUIDPipe) runId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const tenantId = user?.tenantId ?? '';
    const actorId = user?.userId || user?.keycloakId || '';

    try {
      const snapshot = await this.payrollRepository.loadFinalizeSnapshot(tenantId, runId);
      const result = this.finalizePayrollRunUseCase.execute(
        {
          tenantId,
          actorId,
          payrollRunId: runId,
        },
        snapshot,
      );

      await this.payrollRepository.saveFinalizeResult(tenantId, actorId, result);
      return result;
    } catch (error) {
      if (error instanceof PayrollRunError) {
        throw mapPayrollRunError(error);
      }
      throw error;
    }
  }

  @Post('runs/:runId/items')
  @Roles('hris_admin', 'payroll_manager', 'payroll_staff')
  async calculateItem(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Body() body: CalculatePayrollRunItemDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const tenantId = user?.tenantId ?? '';
    const actorId = user?.userId || user?.keycloakId || '';

    try {
      const snapshot = await this.payrollRepository.loadCalculateSnapshot(tenantId, runId, body.employeeId);
      const result = this.calculatePayrollRunItemUseCase.execute(
        {
          tenantId,
          actorId,
          payrollRunId: runId,
          payrollRunItemId: randomUUID(),
          employeeId: body.employeeId,
          currency: body.currency,
          baseSalary: body.baseSalary,
          attendanceDeductionAmount: body.attendanceDeductionAmount,
          earningsTotal: body.earningsTotal,
          bpjsEmployeeTotal: body.bpjsEmployeeTotal,
          bpjsEmployerTotal: body.bpjsEmployerTotal,
          pph21Amount: body.pph21Amount,
          otherDeductionsTotal: body.otherDeductionsTotal,
          salaryProrationJson: body.salaryProrationJson ?? {},
          components: body.components ?? {},
          taxDetail: body.taxDetail ?? {},
        },
        snapshot,
      );

      await this.payrollRepository.saveCalculatedItem(tenantId, result);
      return result;
    } catch (error) {
      if (error instanceof PayrollRunError) {
        throw mapPayrollRunError(error);
      }
      throw error;
    }
  }
}
