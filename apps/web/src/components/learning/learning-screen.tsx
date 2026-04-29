'use client';

import { useMemo, useState } from 'react';
import { Avatar, Badge, Button, Icon, SectionHeading } from '../aurora-primitives';
import { getLearningCopy, useLocale } from '../../i18n';
import { LearningEnrollDialog } from './learning-enroll-dialog';
import { addLearningCourse, filterLearningCourses, getLearningOverview, LEARNING_FILTERS, type CreateLearningCourseInput, type LearningFilter, type LearningStatus } from './learning-data';

const STATUS_TONE: Record<LearningStatus, 'accent' | 'violet' | 'warning' | 'info' | 'success' | 'danger' | 'ghost'> = {
  Mandatory: 'danger',
  Optional: 'violet',
  'In Progress': 'info',
  Completed: 'success',
};

export function LearningScreen() {
  const { locale } = useLocale();
  const copy = getLearningCopy(locale);
  const overview = getLearningOverview();
  const [filter, setFilter] = useState<LearningFilter>('All');
  const [search, setSearch] = useState('');
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [courses, setCourses] = useState(overview.courseCatalog);

  const filteredCourses = useMemo(
    () => filterLearningCourses(courses, filter, search),
    [courses, filter, search],
  );

  const createCourse = (input: CreateLearningCourseInput) => {
    setCourses((current) => addLearningCourse(current, input));
  };

  const progressSnapshot = useMemo(() => overview.progressSnapshot, [overview.progressSnapshot]);

  return (
    <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
      <div className="aurora-card aurora-card-padding aurora-card-lift" style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(139,92,246,0.08))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 240, flex: 1 }}>
            <div className="aurora-card-subtitle" style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, marginBottom: 8 }}>
              {copy.sections.catalog}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1.1px', color: 'var(--text-primary)' }}>{copy.heroLabel}</div>
            <div className="aurora-card-subtitle" style={{ marginTop: 5, maxWidth: 620 }}>
              {copy.summary}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(110px, 1fr))', gap: 10, flex: 1.1 }}>
            {[
              { label: copy.stats.courses, value: overview.courses },
              { label: copy.stats.enrolled, value: overview.enrolled },
              { label: copy.stats.inProgress, value: overview.inProgress },
              { label: copy.stats.certifications, value: overview.certifications },
            ].map((item) => (
              <div key={item.label} className="aurora-card" style={{ padding: 14, background: 'rgba(255,255,255,0.6)', boxShadow: 'none' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.45px' }}>{item.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-1px', marginTop: 6 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card-bg)', borderRadius: 12, padding: '9px 14px', border: '1px solid var(--border)', flex: 1, maxWidth: 340 }}>
          <Icon name="search" size={15} color="var(--text-muted)" strokeWidth={2} />
          <input
            value={search}
            onChange={(event) => setSearch((event.target as HTMLInputElement).value)}
            placeholder={copy.searchPlaceholder}
            style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 13, color: 'var(--text-primary)' }}
          />
        </div>

        <div className="aurora-pill-row">
          {LEARNING_FILTERS.map((item) => (
            <button key={item} type="button" className={`aurora-pill ${filter === item ? 'is-active' : ''}`} onClick={() => setFilter(item)}>
              {copy.filters[item === 'In Progress' ? 'inProgress' : item.toLowerCase() as keyof typeof copy.filters]}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <Button variant="primary" onClick={() => setIsEnrollOpen(true)}>
            <Icon name="plus" size={14} color="#fff" strokeWidth={2} />
            {copy.enrollCourse}
          </Button>
        </div>
      </div>

      <div className="aurora-dual-grid">
        <div className="aurora-card aurora-card-padding aurora-card-lift">
          <SectionHeading title={copy.sections.catalog} subtitle={copy.summary} />
          <div className="aurora-screen-stack" style={{ gap: 12 }}>
            {filteredCourses.map((course) => (
              <div key={`${course.title}-${course.owner}`} style={{ padding: 14, borderRadius: 16, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.55)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{course.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {copy.labels.owner}: {course.owner} {'·'} {copy.labels.duration}: {course.duration}
                    </div>
                  </div>
                  <Badge label={course.status} tone={STATUS_TONE[course.status]} />
                </div>

                <div style={{ height: 7, background: 'rgba(0,0,0,0.05)', borderRadius: 999, overflow: 'hidden', marginTop: 12 }}>
                  <div style={{ height: '100%', width: `${course.completion}%`, background: course.accent, borderRadius: 999 }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>{course.enrolled} {copy.labels.enrolled}</span>
                  <span>{course.completion}% {copy.labels.complete}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="aurora-card aurora-card-padding aurora-card-lift">
          <SectionHeading title={copy.sections.progress} subtitle={copy.summary} />
          <div className="aurora-screen-stack" style={{ gap: 11 }}>
            {progressSnapshot.map((course) => (
              <div key={`${course.title}-${course.owner}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{course.title}</span>
                  <Badge label={course.status} tone={STATUS_TONE[course.status]} />
                </div>
                <div style={{ height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${course.completion}%`, background: course.accent, borderRadius: 10 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11.5, color: 'var(--text-muted)' }}>
                  <span>
                    {copy.labels.due}: {course.due}
                  </span>
                  <span>{course.owner}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="aurora-card aurora-card-padding aurora-card-lift">
        <SectionHeading title={copy.sections.assignments} subtitle={`${filteredCourses.length} ${copy.labels.activeCourses}`} />
        <div className="aurora-table">
          <div className="aurora-table-head" style={{ gridTemplateColumns: '1.7fr 1.2fr 1fr 1fr 1fr 1fr' }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{copy.labels.title}</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{copy.labels.owner}</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{copy.labels.duration}</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{copy.labels.progress}</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{copy.labels.due}</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{copy.labels.status}</span>
          </div>

          {overview.assignments.map((course) => (
            <div key={`${course.title}-${course.owner}`} className="aurora-table-row" style={{ gridTemplateColumns: '1.7fr 1.2fr 1fr 1fr 1fr 1fr' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar initials={course.title.slice(0, 2).toUpperCase()} color={course.accent} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{course.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{course.enrolled} {copy.labels.enrolled}</div>
                </div>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{course.owner}</span>
              <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{course.duration}</span>
              <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{course.completion}%</span>
              <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{course.due}</span>
              <Badge label={course.status} tone={STATUS_TONE[course.status]} />
            </div>
          ))}
        </div>
      </div>

      <LearningEnrollDialog
        open={isEnrollOpen}
        copy={copy}
        onClose={() => setIsEnrollOpen(false)}
        onSubmit={createCourse}
      />

      <div className="aurora-footer-note">{copy.footer}</div>
    </div>
  );
}
