'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Avatar, Badge, Button, Icon, type Accent } from '../aurora-primitives';
import { useLocale } from '../../i18n';
import type { OnboardingCopy } from '../../i18n/onboarding-copy';
import type { Employee } from './people-data';
import { EmployeeOnboardingTaskDialog } from './employee-onboarding-task-dialog';
import {
  ApiError,
  completeOnboardingTask,
  createOnboardingCase,
  uploadOnboardingAttachment,
  fetchOnboardingForEmployee,
  transitionOnboardingCase,
  type OnboardingDetail,
  type OnboardingTaskStatus,
  type OnboardingTask,
} from '../../lib/onboarding-api';

type EmployeeOnboardingDialogProps = {
  open: boolean;
  employee: Employee | undefined;
  copy: OnboardingCopy;
  onClose: () => void;
  onActivated: () => void;
};

type CreateForm = {
  startDate: string;
  contextNote: string;
};

const TASK_LABELS: Record<string, { tone: Accent; label: string }> = {
  employee_documents: { tone: 'accent', label: 'Documents' },
  policy_acknowledgement: { tone: 'success', label: 'Policy' },
  manager_introduction: { tone: 'violet', label: 'Manager intro' },
  payroll_setup: { tone: 'info', label: 'Payroll' },
  access_provisioning: { tone: 'warning', label: 'Access' },
  orientation: { tone: 'ghost', label: 'Orientation' },
};

type OnboardingCaseStatus = NonNullable<OnboardingDetail['onboardingCase']>['status'];

export function EmployeeOnboardingDialog({
  open,
  employee,
  copy,
  onClose,
  onActivated,
}: EmployeeOnboardingDialogProps) {
  const { locale } = useLocale();
  const [detail, setDetail] = useState<OnboardingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<OnboardingTask | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>(defaultCreateForm());

  useEffect(() => {
    if (!open || !employee?.id) {
      setDetail(null);
      setLoading(false);
      setFeedback(null);
      setBusyAction(null);
      setActiveTask(null);
      return;
    }

    let cancelled = false;
    setDetail(null);
    setFeedback(null);
    setBusyAction(null);
    setActiveTask(null);
    setLoading(true);
    setCreateForm(defaultCreateForm());

    fetchOnboardingForEmployee(employee.id)
      .then((nextDetail) => {
        if (!cancelled) {
          setDetail(nextDetail);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFeedback(resolveApiError(error, copy.loadFailed, copy));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [copy, employee?.id, open]);

  if (!open || !employee) {
    return null;
  }

  const hireCase = detail?.hireCase ?? detail?.openHireCase ?? null;
  const onboardingCase = detail?.onboardingCase ?? detail?.openOnboardingCase ?? null;
  const tasks = detail?.tasks ?? [];
  const attachments = detail?.attachments ?? [];
  const activationHooks = detail?.activationHooks ?? [];
  const activationHookCompletedCount = activationHooks.filter((hook) => hook.status === 'completed').length;
  const activationHookFailedCount = activationHooks.filter((hook) => hook.status === 'failed').length;
  const activationHookPendingCount = activationHooks.filter((hook) => hook.status === 'pending').length;
  const requiredTasks = tasks.filter((task) => task.required);
  const completedRequiredTasks = requiredTasks.filter((task) => task.status === 'completed').length;
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const currentTask = onboardingCase?.currentTaskOrder != null
    ? tasks.find((task) => task.taskOrder === onboardingCase.currentTaskOrder)
    : undefined;
  const caseStatus = onboardingCase ? copy.status[onboardingCase.status] : hireCase ? humanizeStatus(hireCase.status) : copy.status.draft;
  const caseTone = onboardingCase ? onboardingStatusTone(onboardingCase.status) : hireCase ? humanizeCaseTone(hireCase.status) : 'ghost';
  const contextEntries = Object.entries((hireCase?.contextJson ?? detail?.openHireCase?.contextJson ?? {}) as Record<string, unknown>)
    .filter(([key, value]) => key !== 'activationChecklist' && key !== 'activationChecklistSummary' && value !== null && value !== undefined && `${value}`.trim() !== '');

  const canCreate = employee.status === 'Pre_Boarding' && !loading && !onboardingCase;

  const openTaskCapture = (task: OnboardingTask) => {
    setFeedback(null);
    setActiveTask(task);
  };

  const closeTaskCapture = () => {
    setActiveTask(null);
  };

  const submitCreate = async () => {
    if (!employee.id) {
      setFeedback(copy.validation.caseNotFound);
      return;
    }

    if (!createForm.startDate.trim()) {
      setFeedback(copy.validation.createRequired);
      return;
    }

    setFeedback(null);
    setBusyAction('create');
    try {
      const nextDetail = await createOnboardingCase({
        employeeId: employee.id,
        startDate: createForm.startDate.trim(),
        ...(createForm.contextNote.trim()
          ? { contextJson: { note: createForm.contextNote.trim(), source: 'people-ui' } }
          : {}),
      });
      setDetail(nextDetail);
    } catch (error) {
      setFeedback(resolveApiError(error, copy.createFailed, copy));
    } finally {
      setBusyAction(null);
    }
  };

  const completeTask = async (task: OnboardingTask, comment: string): Promise<boolean> => {
    if (!onboardingCase) {
      setFeedback(copy.validation.caseNotFound);
      return false;
    }

    setFeedback(null);
    setBusyAction(`task:${task.id}`);
    try {
      const nextDetail = await completeOnboardingTask(onboardingCase.id, task.id, {
        comment,
      });
      setDetail(nextDetail);
      return true;
    } catch (error) {
      setFeedback(resolveApiError(error, copy.completeFailed, copy));
      return false;
    } finally {
      setBusyAction(null);
    }
  };

  const uploadAttachment = async (file: File): Promise<boolean> => {
    if (!onboardingCase || !activeTask) {
      setFeedback(copy.validation.caseNotFound);
      return false;
    }

    try {
      const nextDetail = await uploadOnboardingAttachment(onboardingCase.id, activeTask.id, file);
      setDetail(nextDetail);
      return true;
    } catch (error) {
      setFeedback(resolveApiError(error, copy.attachmentUploadFailed, copy));
      return false;
    }
  };

  const transition = async (action: 'activate' | 'hold' | 'cancel' | 'reactivate') => {
    if (!onboardingCase) {
      setFeedback(copy.validation.caseNotFound);
      return;
    }

    setFeedback(null);
    setBusyAction(`transition:${action}`);
    try {
      const nextDetail = await transitionOnboardingCase(onboardingCase.id, { action });
      setDetail(nextDetail);
      if (action === 'activate') {
        onActivated();
      }
    } catch (error) {
      setFeedback(resolveApiError(error, copy.transitionFailed, copy));
    } finally {
      setBusyAction(null);
    }
  };

  const actionStack = buildActionStack(onboardingCase?.status, copy);

  return (
    <div className="aurora-overlay" style={overlayStyle} onClick={onClose}>
      <div
        className="aurora-card aurora-card-padding aurora-card-lift"
        style={cardStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={heroStyle}>
          <div style={heroBackdropStyle} />
          <div style={heroContentStyle}>
            <div style={heroTopRowStyle}>
              <div style={heroIdentityStyle}>
                <Avatar initials={employee.initials} color={employee.color} size={56} />
                <div style={{ minWidth: 0 }}>
                  <div className="aurora-card-title" style={{ fontSize: 24, marginBottom: 4 }}>
                    {copy.title}
                  </div>
                  <div className="aurora-card-subtitle" style={{ lineHeight: 1.5 }}>
                    {copy.subtitle}
                  </div>
                  <div style={metaRowStyle}>
                    <Badge label={employee.status} tone={employeeStatusTone(employee.status)} />
                    <Badge label={employee.role} tone="ghost" />
                    <Badge label={employee.dept} tone="accent" />
                    <Badge label={employee.type} tone="violet" />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label={copy.close}
                style={closeStyle}
              >
                <Icon name="xMark" size={16} color="var(--text-muted)" strokeWidth={2} />
              </button>
            </div>

            <div style={statsGridStyle}>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>{copy.employeeSummary}</div>
                <div style={statValueStyle}>{employee.role}</div>
                <div style={statHintStyle}>{employee.dept}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>{copy.caseStatus}</div>
                <div style={statValueStyle}>{caseStatus}</div>
                <div style={statHintStyle}>{hireCase ? `${copy.hireCaseLabel}: ${humanizeStatus(hireCase.status)}` : copy.noCaseMessage}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>{copy.taskProgress}</div>
                <div style={statValueStyle}>{completedRequiredTasks}/{requiredTasks.length}</div>
                <div style={statHintStyle}>{completedTasks} {copy.completedLabel.toLowerCase()}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>{copy.startDate}</div>
                <div style={statValueStyle}>{formatDate(onboardingCase?.startDate ?? hireCase?.startDate ?? createForm.startDate, locale)}</div>
                <div style={statHintStyle}>{currentTask ? `${copy.currentTaskLabel}: ${currentTask.title}` : copy.noActiveTask}</div>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div style={loadingStyle}>
            <div style={loadingDotStyle} />
            <div className="aurora-card-subtitle">{copy.loading}</div>
          </div>
        )}

        {feedback && (
          <div style={feedbackStyle} role="alert" aria-live="polite">
            <Icon name="xMark" size={16} color="var(--danger)" strokeWidth={2} />
            <div>{feedback}</div>
          </div>
        )}

        <EmployeeOnboardingTaskDialog
          open={activeTask !== null}
          employee={employee}
          task={activeTask}
          attachments={activeTask ? attachments.filter((item) => item.onboardingTaskId === activeTask.id) : []}
          copy={copy}
          onClose={closeTaskCapture}
          onUploadAttachment={uploadAttachment}
          onSubmit={async (comment) => {
            if (!activeTask) return false;
            return completeTask(activeTask, comment);
          }}
        />

        <div className="aurora-screen-stack" style={{ gap: 18 }}>
          {!loading && !onboardingCase && (
            <section style={sectionCardStyle}>
                <div style={sectionHeaderStyle}>
                  <div>
                    <div className="aurora-card-title" style={{ fontSize: 16 }}>{copy.createCta}</div>
                    <div className="aurora-card-subtitle" style={{ marginTop: 2 }}>
                      {copy.noCaseMessage}
                    </div>
                  </div>
                <Badge label={copy.status.draft} tone="ghost" />
              </div>

              <div className="aurora-dual-grid">
                <label className="field">
                  <span className="aurora-card-subtitle">{copy.startDate}</span>
                  <input
                    type="date"
                    value={createForm.startDate}
                    onChange={(event) => setCreateForm((current) => ({ ...current, startDate: event.target.value }))}
                    style={inputStyle}
                  />
                  <span className="aurora-card-subtitle" style={helpTextStyle}>{copy.startDateHelp}</span>
                </label>
                <label className="field">
                  <span className="aurora-card-subtitle">{copy.context}</span>
                  <textarea
                    value={createForm.contextNote}
                    onChange={(event) => setCreateForm((current) => ({ ...current, contextNote: event.target.value }))}
                    style={{ ...inputStyle, minHeight: 118, resize: 'vertical' }}
                    placeholder={copy.contextHelp}
                  />
                  <span className="aurora-card-subtitle" style={helpTextStyle}>{copy.contextHelp}</span>
                </label>
              </div>

              <div style={footerRowStyle}>
                <div className="aurora-card-subtitle" style={{ maxWidth: 420, lineHeight: 1.45 }}>
                  {canCreate ? copy.startDateHelp : copy.validation.createNotReady}
                </div>
                <Button variant="primary" onClick={submitCreate} disabled={!canCreate || busyAction === 'create'}>
                  <Icon name="clipboard" size={14} color="#fff" strokeWidth={2} />
                  {busyAction === 'create' ? copy.working : copy.createCta}
                </Button>
              </div>
            </section>
          )}

          {!loading && onboardingCase && (
            <>
              <section style={sectionCardStyle}>
                <div style={sectionHeaderStyle}>
                  <div>
                    <div className="aurora-card-title" style={{ fontSize: 16 }}>{copy.caseSummary}</div>
                    <div className="aurora-card-subtitle" style={{ marginTop: 2 }}>
                      {copy.caseSummaryHelp}
                    </div>
                  </div>
                  <Badge label={caseStatus} tone={caseTone} />
                </div>

                <div className="aurora-dual-grid">
                  <div style={summaryCardStyle}>
                    <div style={summaryLabelStyle}>{copy.caseStatus}</div>
                    <div style={summaryValueStyle}>{caseStatus}</div>
                    <div style={summaryHintStyle}>
                      {currentTask ? `${copy.currentTaskLabel}: ${currentTask.title}` : copy.noActiveTask}
                    </div>
                  </div>
                  <div style={summaryCardStyle}>
                    <div style={summaryLabelStyle}>{copy.taskProgress}</div>
                    <div style={summaryValueStyle}>{completedRequiredTasks}/{requiredTasks.length}</div>
                    <div style={summaryHintStyle}>
                      {requiredTasks.length > 0
                        ? `${requiredTasks.length - completedRequiredTasks} ${requiredTasks.length - completedRequiredTasks === 1 ? (locale === 'id' ? 'tugas' : 'task') : copy.taskCountSuffix} ${copy.remainingSuffix}`
                        : copy.noRequiredTasks}
                    </div>
                  </div>
                </div>

              {contextEntries.length > 0 && (
                <div style={contextGridStyle}>
                  {contextEntries.map(([key, value]) => (
                    <div key={key} style={contextItemStyle}>
                      <div style={contextKeyStyle}>{formatKeyLabel(key)}</div>
                      <div style={contextValueStyle}>{String(value)}</div>
                    </div>
                  ))}
                </div>
              )}

              {activationHooks.length > 0 && (
                <div style={activationChecklistStyle}>
                  <div style={sectionHeaderStyle}>
                    <div>
                      <div className="aurora-card-title" style={{ fontSize: 16 }}>{copy.activationChecklistTitle}</div>
                      <div className="aurora-card-subtitle" style={{ marginTop: 2 }}>
                        {copy.activationChecklistSubtitle}
                      </div>
                    </div>
                    <div style={activationChecklistBadgeRowStyle}>
                      <Badge
                        label={`${activationHookCompletedCount}/${activationHooks.length} ${copy.activationChecklistDoneSuffix}`}
                        tone="accent"
                      />
                      {activationHookFailedCount > 0 && (
                        <Badge
                          label={`${activationHookFailedCount} issue${activationHookFailedCount === 1 ? '' : 's'}`}
                          tone="danger"
                        />
                      )}
                      {activationHookPendingCount > 0 && (
                        <Badge
                          label={`${activationHookPendingCount} queued`}
                          tone="warning"
                        />
                      )}
                    </div>
                  </div>

                  <div style={activationHookStackStyle}>
                    {activationHooks.map((hook) => (
                      <div key={hook.key} style={activationHookItemStyle}>
                        <div style={{ minWidth: 0 }}>
                          <div style={activationHookTitleStyle}>{hook.label}</div>
                          <div style={activationHookMetaStyle}>{hook.message ?? copy.activationChecklistQueuedFallback}</div>
                        </div>
                        <Badge
                          label={hook.status}
                          tone={hook.status === 'completed' ? 'success' : hook.status === 'failed' ? 'danger' : hook.status === 'skipped' ? 'warning' : 'ghost'}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

              <section style={sectionCardStyle}>
                <div style={sectionHeaderStyle}>
                  <div>
                    <div className="aurora-card-title" style={{ fontSize: 16 }}>{copy.taskSummary}</div>
                    <div className="aurora-card-subtitle" style={{ marginTop: 2 }}>
                      {copy.taskSummaryHelp}
                    </div>
                  </div>
                  <Badge label={`${tasks.length} ${tasks.length === 1 ? (locale === 'id' ? 'tugas' : 'task') : copy.taskCountSuffix}`} tone="accent" />
                </div>

                {tasks.length === 0 ? (
                  <div style={emptyStateStyle}>{copy.noCaseMessage}</div>
                ) : (
                  <div style={taskStackStyle}>
                    {tasks.map((task, index) => {
                      const tone = taskTone(task);
                      const isBusy = busyAction === `task:${task.id}`;
                      return (
                        <div key={task.id} style={taskRowStyle}>
                          <div style={taskRailStyle}>
                            <div style={{ ...taskDotStyle, background: tone.dot }} />
                            {index < tasks.length - 1 && <div style={taskLineStyle} />}
                          </div>

                          <div style={taskCardStyle}>
                            <div style={taskHeaderStyle}>
                              <div style={{ minWidth: 0 }}>
                                <div style={taskTitleStyle}>{task.title}</div>
                                <div style={taskSubtitleStyle}>{task.description ?? copy.taskLabel}</div>
                              </div>
                              <Badge label={taskStatusLabel(task.status, copy)} tone={tone.tone} />
                            </div>

                            <div style={chipRowStyle}>
                              <Badge label={`${copy.assigneeLabel}: ${task.assigneeRole}`} tone="ghost" />
                              <Badge label={`${copy.requiredLabel}: ${task.required ? copy.completedLabel : copy.pendingLabel}`} tone={task.required ? 'warning' : 'info'} />
                              <Badge label={copy.taskLabels[task.code as keyof OnboardingCopy['taskLabels']] ?? formatTaskLabel(task)} tone={tone.tone} />
                            </div>

                            {task.status === 'completed' ? (
                              <div style={taskCompletedStyle}>
                                <div>{task.completedAt ? `Completed ${formatDateTime(task.completedAt, locale)}` : copy.completedLabel}</div>
                                {task.comment && <div style={taskCommentStyle}>{summarizeTaskComment(task.comment)}</div>}
                              </div>
                            ) : (
                              <div style={taskActionRowStyle}>
                                <div style={taskHintStyle}>
                                  {task.required ? copy.requiredBeforeActivation : copy.optionalTask}
                                </div>
                                <Button variant="primary" onClick={() => openTaskCapture(task)} disabled={isBusy}>
                                  <Icon name="checkCircle" size={14} color="#fff" strokeWidth={2} />
                                  {isBusy ? copy.working : copy.captureTask}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <div style={footerStyle}>
                <div className="aurora-card-subtitle">{copy.footerHint}</div>
                <div style={buttonRowStyle}>
                  {actionStack.map((action) => (
                    <Button
                      key={action.key}
                      variant={action.variant}
                      onClick={() => transition(action.key)}
                      disabled={busyAction === `transition:${action.key}`}
                    >
                      <Icon name={action.icon} size={14} color={action.variant === 'primary' ? '#fff' : 'currentColor'} strokeWidth={2} />
                      {busyAction === `transition:${action.key}` ? copy.working : action.label}
                    </Button>
                  ))}
                  <Button variant="ghost" onClick={onClose}>
                    <Icon name="xMark" size={14} color="currentColor" strokeWidth={2} />
                    {copy.close}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function defaultCreateForm(): CreateForm {
  return {
    startDate: todayValue(),
    contextNote: '',
  };
}

function todayValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function humanizeStatus(status: string): string {
  return status
    .split('_')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function formatKeyLabel(key: string): string {
  return key
    .split('_')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function formatDate(value: string, locale: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(value: string, locale: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(locale === 'id' ? 'id-ID' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function onboardingStatusTone(status: OnboardingCaseStatus | string | undefined): Accent {
  switch (status) {
    case 'draft':
      return 'ghost';
    case 'in_progress':
      return 'accent';
    case 'ready_for_start':
      return 'success';
    case 'active':
      return 'success';
    case 'on_hold':
      return 'warning';
    case 'completed':
      return 'violet';
    case 'cancelled':
      return 'danger';
    default:
      return 'ghost';
  }
}

function humanizeCaseTone(status: string): Accent {
  switch (status) {
    case 'approved':
    case 'ready_for_start':
      return 'success';
    case 'on_hold':
      return 'warning';
    case 'cancelled':
      return 'danger';
    default:
      return 'ghost';
  }
}

function employeeStatusTone(status: Employee['status']): Accent {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Suspended':
      return 'warning';
    case 'On Leave':
      return 'info';
    case 'Terminated':
      return 'danger';
    case 'Pre_Boarding':
      return 'violet';
    default:
      return 'ghost';
  }
}

function taskTone(task: OnboardingTask): { tone: Accent; dot: string } {
  if (task.status === 'completed') {
    return { tone: 'success', dot: 'var(--success)' };
  }
  if (task.status === 'blocked') {
    return { tone: 'warning', dot: 'var(--warning)' };
  }
  if (task.status === 'in_progress') {
    return { tone: 'accent', dot: 'var(--accent)' };
  }
  if (task.status === 'waived') {
    return { tone: 'info', dot: 'var(--info)' };
  }
  const taskLabel = TASK_LABELS[task.code];
  return taskLabel
    ? { tone: taskLabel.tone, dot: 'var(--text-muted)' }
    : { tone: 'ghost', dot: 'var(--text-muted)' };
}

function buildActionStack(status: OnboardingCaseStatus | undefined, copy: OnboardingCopy): Array<{
  key: 'activate' | 'hold' | 'cancel' | 'reactivate';
  label: string;
  icon: 'checkCircle' | 'clock' | 'trash' | 'trending';
  variant: 'primary' | 'ghost';
}> {
  const actions: Array<{
    key: 'activate' | 'hold' | 'cancel' | 'reactivate';
    label: string;
    icon: 'checkCircle' | 'clock' | 'trash' | 'trending';
    variant: 'primary' | 'ghost';
  }> = [];

  if (status === 'ready_for_start' || status === 'in_progress') {
    actions.push({ key: 'activate', label: copy.activate, icon: 'checkCircle', variant: 'primary' });
  }

  if (!status || (status !== 'active' && status !== 'completed' && status !== 'cancelled')) {
    if (status === 'on_hold') {
      actions.push({ key: 'reactivate', label: copy.reactivate, icon: 'trending', variant: 'ghost' });
    } else {
      actions.push({ key: 'hold', label: copy.hold, icon: 'clock', variant: 'ghost' });
    }
    actions.push({ key: 'cancel', label: copy.cancel, icon: 'trash', variant: 'ghost' });
  }

  return actions;
}

function resolveApiError(error: unknown, fallback: string, copy: OnboardingCopy): string {
  const code = extractErrorCode(error);
  if (!code) {
    return fallback;
  }

  const map: Record<string, string> = {
    EMPLOYEE_NOT_FOUND: copy.validation.caseNotFound,
    TENANT_MISMATCH: copy.validation.caseNotFound,
    EMPLOYEE_NOT_READY: copy.validation.createNotReady,
    CASE_ALREADY_EXISTS: copy.validation.createExists,
    START_DATE_BEFORE_HIRE: copy.validation.createStartBeforeHire,
    ONBOARDING_CASE_NOT_FOUND: copy.validation.caseNotFound,
    HIRE_CASE_NOT_FOUND: copy.validation.caseNotFound,
    TASK_NOT_FOUND: copy.validation.taskNotFound,
    TASK_ALREADY_COMPLETED: copy.validation.taskAlreadyCompleted,
    TASK_ACTOR_ROLE_NOT_ALLOWED: copy.validation.taskActorRoleNotAllowed,
    CASE_NOT_READY: copy.validation.caseNotReady,
    TASKS_INCOMPLETE: copy.validation.tasksIncomplete,
    START_DATE_NOT_REACHED: copy.validation.startDateNotReached,
    CASE_NOT_HOLDABLE: copy.validation.caseNotHoldable,
    CASE_NOT_CANCELLABLE: copy.validation.caseNotCancellable,
    CASE_NOT_ON_HOLD: copy.validation.caseNotOnHold,
    ATTACHMENT_REQUIRED: copy.attachmentRequired,
    ATTACHMENT_NOT_ALLOWED: copy.attachmentUploadFailed,
    ATTACHMENT_EMPTY: copy.attachmentUploadFailed,
    ATTACHMENT_TYPE_INVALID: copy.attachmentUploadFailed,
    ATTACHMENT_NOT_FOUND: copy.attachmentDownloadFailed,
    ATTACHMENT_STORAGE_FAILED: copy.attachmentUploadFailed,
  };

  return map[code] ?? fallback;
}

function extractErrorCode(error: unknown): string | null {
  if (error instanceof ApiError) {
    const body = error.body as { error?: { code?: string } } | null;
    return body?.error?.code ?? null;
  }

  if (typeof error === 'object' && error && 'body' in error) {
    const body = (error as { body?: { error?: { code?: string } } | null }).body;
    return body?.error?.code ?? null;
  }

  return null;
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.42)',
  backdropFilter: 'blur(10px)',
  zIndex: 30,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

const cardStyle: CSSProperties = {
  width: 'min(980px, 100%)',
  maxHeight: '88vh',
  overflowY: 'auto',
};

const heroStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 20,
  border: '1px solid var(--border)',
  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.10), rgba(139, 92, 246, 0.08), rgba(16, 185, 129, 0.08))',
  marginBottom: 18,
};

const heroBackdropStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'radial-gradient(circle at top right, rgba(255,255,255,0.35), transparent 40%)',
  pointerEvents: 'none',
};

const heroContentStyle: CSSProperties = {
  position: 'relative',
  padding: 18,
};

const heroTopRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'start',
};

const heroIdentityStyle: CSSProperties = {
  display: 'flex',
  gap: 14,
  alignItems: 'center',
  minWidth: 0,
};

const metaRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 12,
};

const statsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 10,
  marginTop: 18,
};

const statCardStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 16,
  background: 'rgba(255,255,255,0.52)',
  padding: 12,
  minWidth: 0,
};

const statLabelStyle: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
};

const statValueStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--text-primary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const statHintStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 12.5,
  color: 'var(--text-muted)',
  lineHeight: 1.45,
};

const summaryHintStyle: CSSProperties = statHintStyle;

const loadingStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 4px 18px',
};

const loadingDotStyle: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: 'var(--accent)',
  boxShadow: '0 0 0 6px rgba(59, 130, 246, 0.14)',
};

const feedbackStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  borderRadius: 16,
  border: '1px solid rgba(239, 68, 68, 0.25)',
  background: 'rgba(239, 68, 68, 0.08)',
  color: 'var(--danger)',
  padding: '12px 14px',
  marginBottom: 16,
  fontSize: 13,
  lineHeight: 1.5,
};

const sectionCardStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 18,
  padding: 16,
  background: 'var(--card-bg)',
};

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  marginBottom: 14,
};

const summaryCardStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 12,
  background: 'rgba(248, 250, 252, 0.9)',
};

const summaryLabelStyle: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
};

const summaryValueStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const contextGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 10,
  marginTop: 12,
};

const contextItemStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '10px 12px',
  background: 'rgba(248, 250, 252, 0.88)',
};

const contextKeyStyle: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
};

const contextValueStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 13,
  color: 'var(--text-primary)',
  wordBreak: 'break-word',
};

const activationChecklistStyle: CSSProperties = {
  marginTop: 16,
  borderTop: '1px solid rgba(148, 163, 184, 0.22)',
  paddingTop: 16,
  display: 'grid',
  gap: 12,
};

const activationChecklistBadgeRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

const activationHookStackStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
};

const activationHookItemStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: '10px 12px',
  background: 'rgba(248, 250, 252, 0.88)',
};

const activationHookTitleStyle: CSSProperties = {
  fontSize: 13.5,
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const activationHookMetaStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 12.5,
  lineHeight: 1.45,
  color: 'var(--text-muted)',
};

const emptyStateStyle: CSSProperties = {
  border: '1px dashed var(--border)',
  borderRadius: 16,
  padding: 18,
  color: 'var(--text-muted)',
  background: 'rgba(148, 163, 184, 0.04)',
};

const taskStackStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const taskRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '22px minmax(0, 1fr)',
  gap: 12,
  alignItems: 'stretch',
};

const taskRailStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingTop: 10,
};

const taskDotStyle: CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: 999,
  border: '2px solid rgba(255,255,255,0.9)',
  boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.08)',
  zIndex: 1,
};

const taskLineStyle: CSSProperties = {
  flex: 1,
  width: 2,
  minHeight: 28,
  marginTop: 6,
  borderRadius: 999,
  background: 'linear-gradient(180deg, rgba(148, 163, 184, 0.45), rgba(148, 163, 184, 0.15))',
};

const taskCardStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 14,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))',
};

const taskHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
};

const taskTitleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const taskSubtitleStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 12.5,
  color: 'var(--text-muted)',
};

const chipRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 12,
};

const taskActionRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  marginTop: 12,
};

const taskHintStyle: CSSProperties = {
  fontSize: 12.5,
  color: 'var(--text-muted)',
};

const taskCompletedStyle: CSSProperties = {
  marginTop: 12,
  fontSize: 12.5,
  color: 'var(--success)',
  fontWeight: 600,
};

const taskCommentStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 12.5,
  color: 'var(--text-muted)',
  fontWeight: 400,
  lineHeight: 1.5,
};

const footerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
};

const footerRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  marginTop: 16,
};

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

const closeStyle: CSSProperties = {
  border: '1px solid var(--border)',
  background: 'var(--card-bg)',
  borderRadius: 12,
  width: 36,
  height: 36,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
};

const inputStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '10px 12px',
  background: 'var(--card-bg)',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
};

const helpTextStyle: CSSProperties = {
  marginTop: 4,
};

function formatTaskLabel(task: OnboardingTask): string {
  return TASK_LABELS[task.code]?.label ?? task.code
    .split('_')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function taskStatusLabel(status: OnboardingTaskStatus, copy: OnboardingCopy): string {
  switch (status) {
    case 'pending':
      return copy.pendingLabel;
    case 'in_progress':
      return copy.taskInProgress;
    case 'completed':
      return copy.completedLabel;
    case 'waived':
      return copy.taskWaived;
    case 'blocked':
      return copy.taskBlocked;
    default:
      return status;
  }
}

function summarizeTaskComment(comment: string): string {
  try {
    const payload = JSON.parse(comment) as Record<string, unknown>;
    const parts = [
      payload.documents ? `Documents: ${String(payload.documents)}` : null,
      payload.policyAcknowledged ? 'Policy acknowledged' : null,
      payload.notes ? `Notes: ${String(payload.notes)}` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' | ') : comment;
  } catch {
    return comment;
  }
}
