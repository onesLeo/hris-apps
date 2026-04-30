import type {
  OnboardingAttachmentSnapshot,
  OnboardingDetailSnapshot,
  UploadOnboardingAttachmentCommand,
  UploadOnboardingAttachmentResult,
} from './onboarding.types';

export class OnboardingAttachmentError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'OnboardingAttachmentError';
  }
}

export type UploadOnboardingAttachmentSnapshot = Pick<OnboardingDetailSnapshot, 'onboardingCase' | 'tasks'>;

const ALLOWED_ATTACHMENT_TASK_CODES = new Set(['employee_documents', 'access_provisioning']);

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function attachmentTypeForTaskCode(taskCode: string): OnboardingAttachmentSnapshot['attachmentType'] {
  if (taskCode === 'policy_acknowledgement') {
    return 'policy_acknowledgement';
  }
  if (taskCode === 'employee_documents' || taskCode === 'access_provisioning') {
    return 'document';
  }
  return 'other';
}

export class UploadOnboardingAttachmentUseCase {
  execute(
    command: UploadOnboardingAttachmentCommand,
    snapshot: UploadOnboardingAttachmentSnapshot,
    fileName: string,
    mimeType: string,
    fileSize: number,
  ): UploadOnboardingAttachmentResult {
    if (!snapshot.onboardingCase) {
      throw new OnboardingAttachmentError('ONBOARDING_CASE_NOT_FOUND', `Onboarding case ${command.onboardingCaseId} not found`);
    }

    const task = snapshot.tasks.find((item) => item.id === command.onboardingTaskId);
    if (!task) {
      throw new OnboardingAttachmentError('TASK_NOT_FOUND', `Onboarding task ${command.onboardingTaskId} not found`);
    }

    if (!ALLOWED_ATTACHMENT_TASK_CODES.has(task.code)) {
      throw new OnboardingAttachmentError('ATTACHMENT_NOT_ALLOWED', `Attachments are not allowed for task ${task.code}`);
    }

    if (fileSize <= 0) {
      throw new OnboardingAttachmentError('ATTACHMENT_EMPTY', 'Attachment file is empty');
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new OnboardingAttachmentError('ATTACHMENT_TYPE_INVALID', `Attachment type ${mimeType} is not supported`);
    }

    const attachment: OnboardingAttachmentSnapshot = {
      id: command.attachmentId,
      tenantId: command.tenantId,
      onboardingCaseId: command.onboardingCaseId,
      onboardingTaskId: command.onboardingTaskId,
      employeeId: snapshot.onboardingCase.employeeId,
      attachmentType: attachmentTypeForTaskCode(task.code),
      originalFileName: fileName,
      mimeType,
      fileSize,
      storageKey: command.storageKey,
      uploadedBy: command.actorId,
      uploadedAt: command.uploadedAt,
    };

    return {
      attachment,
      events: [
        {
          type: 'onboarding.attachment.uploaded',
          payload: {
            tenantId: command.tenantId,
            onboardingCaseId: command.onboardingCaseId,
            onboardingTaskId: command.onboardingTaskId,
            attachmentId: command.attachmentId,
            attachmentType: attachment.attachmentType,
            fileName,
            mimeType,
            fileSize,
            storageKey: command.storageKey,
            actorId: command.actorId,
            uploadedAt: command.uploadedAt,
          },
        },
      ],
    };
  }
}
