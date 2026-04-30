'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Avatar, Badge, Button, Icon, type Accent } from '../aurora-primitives';
import { useLocale } from '../../i18n';
import type { OnboardingCopy } from '../../i18n/onboarding-copy';
import type { Employee } from './people-data';
import { downloadOnboardingAttachment, type OnboardingAttachment, type OnboardingTask } from '../../lib/onboarding-api';

type EmployeeOnboardingTaskDialogProps = {
  open: boolean;
  employee: Employee;
  task: OnboardingTask | null;
  attachments: OnboardingAttachment[];
  copy: OnboardingCopy;
  onClose: () => void;
  onSubmit: (comment: string) => Promise<boolean>;
  onUploadAttachment: (file: File) => Promise<boolean>;
};

type CaptureState = {
  documents: string;
  policyAcknowledged: boolean;
  notes: string;
};

const INITIAL_STATE: CaptureState = {
  documents: '',
  policyAcknowledged: false,
  notes: '',
};

export function EmployeeOnboardingTaskDialog({
  open,
  employee,
  task,
  attachments,
  copy,
  onClose,
  onSubmit,
  onUploadAttachment,
}: EmployeeOnboardingTaskDialogProps) {
  const { locale } = useLocale();
  const [form, setForm] = useState<CaptureState>(INITIAL_STATE);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open || !task) {
      setForm(INITIAL_STATE);
      setSelectedFile(null);
      setFeedback(null);
      setBusy(false);
      setUploading(false);
      return;
    }

    setForm({
      documents: '',
      policyAcknowledged: task.code === 'policy_acknowledgement',
      notes: '',
    });
    setSelectedFile(null);
    setFeedback(null);
    setBusy(false);
    setUploading(false);
  }, [open, task]);

  if (!open || !task) {
    return null;
  }

  const submit = async () => {
    setFeedback(null);

    if (task.code === 'employee_documents' && !form.documents.trim()) {
      setFeedback(copy.taskCaptureRequired);
      return;
    }

    if (task.code === 'policy_acknowledgement' && !form.policyAcknowledged) {
      setFeedback(copy.taskCapturePolicyRequired);
      return;
    }

    setBusy(true);
    try {
      const success = await onSubmit(buildComment(task, form));
      if (success) {
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  const upload = async () => {
    setFeedback(null);

    if (!selectedFile) {
      setFeedback(copy.attachmentRequired);
      return;
    }

    setUploading(true);
    try {
      const success = await onUploadAttachment(selectedFile);
      if (success) {
        setSelectedFile(null);
        setFeedback(copy.attachmentUploadSuccess);
      }
    } finally {
      setUploading(false);
    }
  };

  const download = async (attachment: OnboardingAttachment) => {
    setFeedback(null);
    try {
      const result = await downloadOnboardingAttachment(attachment.id);
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = result.fileName;
      anchor.rel = 'noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setFeedback(copy.attachmentDownloadFailed);
    }
  };

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
                <Avatar initials={employee.initials} color={employee.color} size={50} />
                <div style={{ minWidth: 0 }}>
                  <div className="aurora-card-title" style={{ fontSize: 22, marginBottom: 4 }}>
                    {copy.taskCaptureTitle}
                  </div>
                  <div className="aurora-card-subtitle" style={{ lineHeight: 1.5 }}>
                    {copy.taskCaptureSubtitle}
                  </div>
                  <div style={metaRowStyle}>
                    <Badge label={task.code} tone={taskTone(task.code)} />
                    <Badge label={employee.name} tone="ghost" />
                    <Badge label={employee.dept} tone="accent" />
                  </div>
                </div>
              </div>

              <button type="button" onClick={onClose} aria-label={copy.taskCaptureCancel} style={closeStyle}>
                <Icon name="xMark" size={16} color="var(--text-muted)" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {feedback && (
          <div style={feedbackStyle} role="alert" aria-live="polite">
            <Icon name="xMark" size={16} color="var(--danger)" strokeWidth={2} />
            <div>{feedback}</div>
          </div>
        )}

        <div className="aurora-screen-stack" style={{ gap: 16 }}>
          <section style={sectionCardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <div className="aurora-card-title" style={{ fontSize: 16 }}>{task.title}</div>
                <div className="aurora-card-subtitle" style={{ marginTop: 2 }}>{task.description ?? copy.taskCaptureSubtitle}</div>
              </div>
              <Badge label={task.required ? copy.requiredLabel : copy.pendingLabel} tone={task.required ? 'warning' : 'info'} />
            </div>

            <div className="aurora-screen-stack" style={{ gap: 14 }}>
              {(task.code === 'employee_documents' || task.code === 'access_provisioning') && (
                <section style={attachmentCardStyle}>
                  <div style={attachmentHeaderStyle}>
                    <div>
                      <div style={sectionSubtitleStyle}>{copy.attachmentSectionTitle}</div>
                      <div style={copyTextStyle}>{copy.attachmentSectionHelp}</div>
                    </div>
                    <Badge label={`${attachments.length} ${attachments.length === 1 ? copy.attachmentLabelSingular : copy.attachmentLabelPlural}`} tone="accent" />
                  </div>

                  <div style={{ display: 'grid', gap: 10 }}>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,application/pdf,image/png,image/jpeg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                      style={fileInputStyle}
                    />
                    <div style={attachmentActionsStyle}>
                      <div style={copyTextStyle}>
                        {selectedFile ? `${copy.attachmentSelected}: ${selectedFile.name}` : copy.attachmentChooseFile}
                      </div>
                      <Button variant="ghost" onClick={upload} disabled={uploading || !selectedFile}>
                        <Icon name="clipboard" size={14} color="currentColor" strokeWidth={2} />
                        {uploading ? copy.working : copy.attachmentUpload}
                      </Button>
                    </div>
                  </div>

                  {attachments.length > 0 && (
                    <div style={attachmentListStyle}>
                      {attachments.map((attachment) => (
                        <div key={attachment.id} style={attachmentItemStyle}>
                          <div style={{ minWidth: 0 }}>
                            <div style={attachmentNameStyle}>{attachment.originalFileName}</div>
                            <div style={attachmentMetaStyle}>
                              {formatFileSize(attachment.fileSize)} · {formatDateTime(attachment.uploadedAt, locale)} · {attachment.mimeType}
                            </div>
                          </div>
                          <Button variant="ghost" onClick={() => download(attachment)}>
                            <Icon name="download" size={14} color="currentColor" strokeWidth={2} />
                            {copy.attachmentDownload}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {(task.code === 'employee_documents' || task.code === 'access_provisioning') && (
                <label className="field">
                  <span className="aurora-card-subtitle">{copy.taskCaptureDocuments}</span>
                  <textarea
                    value={form.documents}
                    onChange={(event) => setForm((current) => ({ ...current, documents: event.target.value }))}
                    style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
                    placeholder={task.code === 'employee_documents'
                      ? copy.taskCaptureDocumentsPlaceholder
                      : 'Laptop, email account, VPN, payroll access...'}
                  />
                  <span className="aurora-card-subtitle" style={helpTextStyle}>{copy.taskCaptureRequired}</span>
                </label>
              )}

              {task.code === 'policy_acknowledgement' && (
                <label style={checkboxCardStyle}>
                  <input
                    type="checkbox"
                    checked={form.policyAcknowledged}
                    onChange={(event) => setForm((current) => ({ ...current, policyAcknowledged: event.target.checked }))}
                  />
                  <div>
                    <div style={checkboxTitleStyle}>{copy.taskCapturePolicy}</div>
                    <div style={checkboxHintStyle}>{task.description ?? copy.taskCapturePolicyRequired}</div>
                  </div>
                </label>
              )}

              <label className="field">
                <span className="aurora-card-subtitle">{copy.taskCaptureNotes}</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }}
                  placeholder={task.code === 'manager_introduction'
                    ? 'Meeting date, attendees, and key points...'
                    : task.code === 'payroll_setup'
                      ? 'Bank details verified, tax profile confirmed...'
                      : task.code === 'orientation'
                        ? 'Welcome agenda and materials covered...'
                        : copy.taskCaptureNotesPlaceholder}
                />
                <span className="aurora-card-subtitle" style={helpTextStyle}>{copy.taskSummaryHelp}</span>
              </label>
            </div>
          </section>

          <div style={footerStyle}>
            <div className="aurora-card-subtitle">{copy.taskCaptureSubtitle}</div>
            <div style={buttonRowStyle}>
              <Button variant="ghost" onClick={onClose}>
                <Icon name="xMark" size={14} color="currentColor" strokeWidth={2} />
                {copy.taskCaptureCancel}
              </Button>
              <Button variant="primary" onClick={submit} disabled={busy}>
                <Icon name="checkCircle" size={14} color="#fff" strokeWidth={2} />
                {busy ? copy.working : copy.taskCaptureSubmit}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildComment(task: OnboardingTask, form: CaptureState): string {
  const payload = {
    taskCode: task.code,
    taskTitle: task.title,
    documents: form.documents.trim() || null,
    policyAcknowledged: form.policyAcknowledged,
    notes: form.notes.trim() || null,
    capturedAt: new Date().toISOString(),
  };

  return JSON.stringify(payload);
}

function taskTone(taskCode: string): Accent {
  switch (taskCode) {
    case 'employee_documents':
      return 'accent';
    case 'policy_acknowledgement':
      return 'success';
    case 'manager_introduction':
      return 'violet';
    case 'payroll_setup':
      return 'info';
    case 'access_provisioning':
      return 'warning';
    default:
      return 'ghost';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(iso: string, locale: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.42)',
  backdropFilter: 'blur(10px)',
  zIndex: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

const cardStyle: CSSProperties = {
  width: 'min(920px, 100%)',
  maxHeight: '88vh',
  overflowY: 'auto',
};

const heroStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 20,
  border: '1px solid var(--border)',
  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(59, 130, 246, 0.10), rgba(139, 92, 246, 0.08))',
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
  marginTop: 10,
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

const checkboxCardStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  borderRadius: 14,
  border: '1px solid var(--border)',
  background: 'rgba(248, 250, 252, 0.9)',
  padding: 14,
};

const checkboxTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const checkboxHintStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 12.5,
  color: 'var(--text-muted)',
  lineHeight: 1.45,
};

const attachmentCardStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 14,
  background: 'rgba(248, 250, 252, 0.85)',
};

const attachmentHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
};

const sectionSubtitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const copyTextStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 12.5,
  color: 'var(--text-muted)',
  lineHeight: 1.45,
};

const attachmentActionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap',
};

const fileInputStyle: CSSProperties = {
  border: '1px dashed var(--border)',
  borderRadius: 12,
  padding: 12,
  background: 'white',
  color: 'var(--text-primary)',
  fontSize: 13,
};

const attachmentListStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  marginTop: 4,
};

const attachmentItemStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '10px 12px',
  background: 'white',
};

const attachmentNameStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--text-primary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const attachmentMetaStyle: CSSProperties = {
  marginTop: 3,
  fontSize: 12,
  color: 'var(--text-muted)',
};

const footerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
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
