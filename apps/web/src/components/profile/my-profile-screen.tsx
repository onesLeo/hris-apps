'use client';

import { useEffect, useState } from 'react';
import { Icon, Button } from '../aurora-primitives';
import { fetchMyProfile, updateMyProfile, type EmployeeProfile, type UpdateProfileInput } from '../../lib/employee-profile-api';

export function MyProfileScreen() {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateProfileInput>({});

  useEffect(() => {
    fetchMyProfile()
      .then((data) => {
        setProfile(data);
        setFormData({
          address: data.address || '',
          city: data.city || '',
          province: data.province || '',
          postalCode: data.postalCode || '',
          nik: data.nik || '',
          bpjsHealth: data.bpjsHealth || '',
          bpjsEmployment: data.bpjsEmployment || '',
          bpjsPension: data.bpjsPension || '',
          bpjsAccident: data.bpjsAccident || '',
        });
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateMyProfile(formData);
      setProfile(updated);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="aurora-screen-stack">
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>My Profile</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4, margin: 0 }}>Manage your personal information</p>
          </div>
          {!isEditing && (
            <Button size="sm" variant="primary" onClick={() => setIsEditing(true)}>
              <Icon name="pencil" size={13} color="#fff" strokeWidth={2} />
              Edit
            </Button>
          )}
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.22)',
              color: 'var(--text-primary)',
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {/* Personal Info Card */}
        <div className="aurora-card aurora-card-padding aurora-card-lift" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.45px', marginBottom: 16 }}>
            Personal Information
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Name</label>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{profile.displayName}</div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Email</label>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{profile.email}</div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Phone</label>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{profile.phone || '—'}</div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Date of Birth</label>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{profile.dateOfBirth || '—'}</div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Hire Date</label>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{profile.hireDate}</div>
            </div>
          </div>
        </div>

        {/* Address Card */}
        <div className="aurora-card aurora-card-padding aurora-card-lift" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.45px', marginBottom: 16 }}>
            Address
          </div>
          {isEditing ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              <input
                type="text"
                placeholder="Street Address"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    fontSize: 13,
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Province"
                  value={formData.province || ''}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    fontSize: 13,
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <input
                type="text"
                placeholder="Postal Code"
                value={formData.postalCode || ''}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Street</label>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{profile.address || '—'}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>City</label>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{profile.city || '—'}</div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Province</label>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{profile.province || '—'}</div>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Postal Code</label>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{profile.postalCode || '—'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Identity Card */}
        <div className="aurora-card aurora-card-padding aurora-card-lift" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.45px', marginBottom: 16 }}>
            Identity
          </div>
          {isEditing ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              <input
                type="text"
                placeholder="NIK (National ID)"
                value={formData.nik || ''}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          ) : (
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>NIK</label>
              <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                {profile.nik ? `••••••••${profile.nik.slice(-4)}` : '—'}
              </div>
            </div>
          )}
        </div>

        {/* BPJS Card */}
        <div className="aurora-card aurora-card-padding aurora-card-lift" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.45px', marginBottom: 16 }}>
            BPJS Information
          </div>
          {isEditing ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              <input
                type="text"
                placeholder="BPJS Health"
                value={formData.bpjsHealth || ''}
                onChange={(e) => setFormData({ ...formData, bpjsHealth: e.target.value })}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                }}
              />
              <input
                type="text"
                placeholder="BPJS Employment"
                value={formData.bpjsEmployment || ''}
                onChange={(e) => setFormData({ ...formData, bpjsEmployment: e.target.value })}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                }}
              />
              <input
                type="text"
                placeholder="BPJS Pension"
                value={formData.bpjsPension || ''}
                onChange={(e) => setFormData({ ...formData, bpjsPension: e.target.value })}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                }}
              />
              <input
                type="text"
                placeholder="BPJS Accident"
                value={formData.bpjsAccident || ''}
                onChange={(e) => setFormData({ ...formData, bpjsAccident: e.target.value })}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Health</label>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                  {profile.bpjsHealth ? `••••••••${profile.bpjsHealth.slice(-4)}` : '—'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Employment</label>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                  {profile.bpjsEmployment ? `••••••••${profile.bpjsEmployment.slice(-4)}` : '—'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Pension</label>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                  {profile.bpjsPension ? `••••••••${profile.bpjsPension.slice(-4)}` : '—'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Accident</label>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                  {profile.bpjsAccident ? `••••••••${profile.bpjsAccident.slice(-4)}` : '—'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
