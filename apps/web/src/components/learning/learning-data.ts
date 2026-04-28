export type LearningStatus = 'Mandatory' | 'Optional' | 'In Progress' | 'Completed';
export type LearningFilter = 'All' | LearningStatus;

export type LearningCourse = {
  title: string;
  owner: string;
  duration: string;
  status: LearningStatus;
  due: string;
  enrolled: number;
  completion: number;
  accent: string;
};

export type LearningOverview = {
  courses: number;
  enrolled: number;
  inProgress: number;
  certifications: number;
  courseCatalog: readonly LearningCourse[];
  progressSnapshot: readonly LearningCourse[];
  assignments: readonly LearningCourse[];
};

export type CreateLearningCourseInput = Omit<LearningCourse, 'accent'>;

export const LEARNING_FILTERS: readonly LearningFilter[] = ['All', 'Mandatory', 'Optional', 'In Progress', 'Completed'] as const;

const OVERVIEW: LearningOverview = {
  courses: 8,
  enrolled: 124,
  inProgress: 47,
  certifications: 28,
  courseCatalog: [
    { title: 'HR Foundations', owner: 'People Ops', duration: '4h', status: 'Mandatory', due: 'May 15', enrolled: 92, completion: 100, accent: '#e8317a' },
    { title: 'Manager Coaching Basics', owner: 'Leadership', duration: '3h', status: 'Optional', due: 'May 20', enrolled: 54, completion: 68, accent: '#8b5cf6' },
    { title: 'Payroll Compliance 101', owner: 'Finance', duration: '2h', status: 'Mandatory', due: 'May 12', enrolled: 76, completion: 100, accent: '#10b981' },
    { title: 'Inclusive Hiring Workshop', owner: 'Recruitment', duration: '5h', status: 'In Progress', due: 'Jun 1', enrolled: 38, completion: 42, accent: '#0ea5e9' },
  ],
  progressSnapshot: [
    { title: 'HR Foundations', owner: 'People Ops', duration: '4h', status: 'Completed', due: 'May 15', enrolled: 92, completion: 100, accent: '#e8317a' },
    { title: 'Manager Coaching Basics', owner: 'Leadership', duration: '3h', status: 'In Progress', due: 'May 20', enrolled: 54, completion: 68, accent: '#8b5cf6' },
    { title: 'Payroll Compliance 101', owner: 'Finance', duration: '2h', status: 'Completed', due: 'May 12', enrolled: 76, completion: 100, accent: '#10b981' },
    { title: 'Inclusive Hiring Workshop', owner: 'Recruitment', duration: '5h', status: 'In Progress', due: 'Jun 1', enrolled: 38, completion: 42, accent: '#0ea5e9' },
  ],
  assignments: [
    { title: 'Q2 Leadership Track', owner: 'Leadership', duration: '6h', status: 'In Progress', due: 'May 30', enrolled: 18, completion: 56, accent: '#8b5cf6' },
    { title: 'New Manager Orientation', owner: 'People Ops', duration: '2h', status: 'Mandatory', due: 'May 18', enrolled: 12, completion: 100, accent: '#e8317a' },
    { title: 'Security Awareness', owner: 'IT', duration: '1.5h', status: 'Mandatory', due: 'May 10', enrolled: 124, completion: 100, accent: '#10b981' },
    { title: 'Coaching Quarterly Check-in', owner: 'People Ops', duration: '2h', status: 'Optional', due: 'Jun 3', enrolled: 31, completion: 24, accent: '#0ea5e9' },
  ],
};

export function getLearningOverview(): LearningOverview {
  return OVERVIEW;
}

export function filterLearningCourses(
  courses: readonly LearningCourse[],
  filter: LearningFilter,
  search: string,
): readonly LearningCourse[] {
  const query = search.trim().toLowerCase();

  return courses.filter((course) => {
    const matchesFilter = filter === 'All' || course.status === filter;
    const matchesSearch =
      !query ||
      course.title.toLowerCase().includes(query) ||
      course.owner.toLowerCase().includes(query) ||
      course.duration.toLowerCase().includes(query) ||
      course.due.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });
}

export function addLearningCourse(
  courses: readonly LearningCourse[],
  input: CreateLearningCourseInput,
): LearningCourse[] {
  return [
    {
      ...input,
      accent:
        input.status === 'Mandatory'
          ? '#e8317a'
          : input.status === 'Completed'
            ? '#10b981'
            : input.status === 'In Progress'
              ? '#8b5cf6'
              : '#0ea5e9',
    },
    ...courses,
  ];
}
