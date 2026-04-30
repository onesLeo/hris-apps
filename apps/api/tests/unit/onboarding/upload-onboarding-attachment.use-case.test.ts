import assert from 'node:assert/strict';
import test from 'node:test';
import {
  OnboardingAttachmentError,
  UploadOnboardingAttachmentUseCase,
  type UploadOnboardingAttachmentSnapshot,
} from '../../../src/modules/onboarding/upload-onboarding-attachment.use-case.ts';

const tenantId = 'tenant-1';

function makeSnapshot(overrides?: Partial<UploadOnboardingAttachmentSnapshot>): UploadOnboardingAttachmentSnapshot {
  return {
    onboardingCase: {
      id: 'onboarding-case-1',
      tenantId,
      hireCaseId: 'hire-case-1',
      employeeId: 'employee-1',
      status: 'in_progress',
      startDate: '2026-05-01',
      currentTaskOrder: 1,
      activatedAt: null,
      holdReason: null,
      cancelReason: null,
    },
    tasks: [
      {
        id: 'task-1',
        tenantId,
        onboardingCaseId: 'onboarding-case-1',
        taskOrder: 1,
        code: 'employee_documents',
        title: 'Collect employee documents',
        description: null,
        assigneeRole: 'employee',
        status: 'pending',
        required: true,
        dueDate: null,
        completedBy: null,
        completedAt: null,
        comment: null,
      },
    ],
    ...overrides,
  };
}

test('uploads a document attachment for an allowed onboarding task', () => {
  const useCase = new UploadOnboardingAttachmentUseCase();
  const snapshot = makeSnapshot();

  const result = useCase.execute(
    {
      tenantId,
      actorId: 'hr-1',
      onboardingCaseId: 'onboarding-case-1',
      onboardingTaskId: 'task-1',
      attachmentId: 'attachment-1',
      originalFileName: 'ktp.pdf',
      mimeType: 'application/pdf',
      fileSize: 2048,
      storageKey: 'onboarding/tenant-1/onboarding-case-1/task-1/attachment-1.pdf',
      uploadedAt: '2026-04-30T10:00:00.000Z',
    },
    snapshot,
    'ktp.pdf',
    'application/pdf',
    2048,
  );

  assert.equal(result.attachment.originalFileName, 'ktp.pdf');
  assert.equal(result.attachment.attachmentType, 'document');
  assert.equal(result.events[0]?.type, 'onboarding.attachment.uploaded');
});

test('rejects uploads when the task does not allow attachments', () => {
  const useCase = new UploadOnboardingAttachmentUseCase();
  const snapshot = makeSnapshot({
    tasks: [{
      ...makeSnapshot().tasks[0],
      code: 'manager_introduction',
    }],
  });

  assert.throws(() => {
    useCase.execute(
      {
        tenantId,
        actorId: 'hr-1',
        onboardingCaseId: 'onboarding-case-1',
        onboardingTaskId: 'task-1',
        attachmentId: 'attachment-1',
        originalFileName: 'note.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        storageKey: 'onboarding/tenant-1/onboarding-case-1/task-1/attachment-1.pdf',
        uploadedAt: '2026-04-30T10:00:00.000Z',
      },
      snapshot,
      'note.pdf',
      'application/pdf',
      1024,
    );
  }, (error: unknown) => error instanceof OnboardingAttachmentError && error.code === 'ATTACHMENT_NOT_ALLOWED');
});

test('rejects uploads with unsupported mime types', () => {
  const useCase = new UploadOnboardingAttachmentUseCase();
  const snapshot = makeSnapshot();

  assert.throws(() => {
    useCase.execute(
      {
        tenantId,
        actorId: 'hr-1',
        onboardingCaseId: 'onboarding-case-1',
        onboardingTaskId: 'task-1',
        attachmentId: 'attachment-1',
        originalFileName: 'script.exe',
        mimeType: 'application/x-msdownload',
        fileSize: 1024,
        storageKey: 'onboarding/tenant-1/onboarding-case-1/task-1/attachment-1.exe',
        uploadedAt: '2026-04-30T10:00:00.000Z',
      },
      snapshot,
      'script.exe',
      'application/x-msdownload',
      1024,
    );
  }, (error: unknown) => error instanceof OnboardingAttachmentError && error.code === 'ATTACHMENT_TYPE_INVALID');
});
