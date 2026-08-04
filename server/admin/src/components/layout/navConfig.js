import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  BookOpen,
  Users,
  ShieldCheck,
  FileText,
  CalendarClock,
  ClipboardCheck,
  BarChart3,
  Accessibility,
  Settings,
  Activity,
  Radar,
  LineChart,
  Printer,
} from 'lucide-react';
import { PATHS } from '../../routes/paths';
import { USER_ROLES } from '../../utils/constants';

/**
 * Sidebar navigation groups. Items flagged `isPlanned` render as
 * future-ready entries (no feature screens yet).
 */
export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: PATHS.DASHBOARD, icon: LayoutDashboard },
    ],
  },
  {
    label: 'Academic Structure',
    items: [
      { label: 'Departments', path: PATHS.DEPARTMENTS, icon: Building2 },
      { label: 'Classes', path: PATHS.CLASSES, icon: GraduationCap },
      { label: 'Subjects', path: PATHS.SUBJECTS, icon: BookOpen },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Students', path: PATHS.STUDENTS, icon: Users },
      { label: 'Administrators', path: PATHS.ADMINISTRATORS, icon: ShieldCheck, roles: [USER_ROLES.ADMIN] },
    ],
  },
  {
    label: 'Examinations',
    items: [
      { label: 'Exams', path: PATHS.EXAMS, icon: FileText },
      { label: 'Exam Schedules', path: PATHS.SCHEDULES, icon: CalendarClock },
    ],
  },
  {
    label: 'Assessment',
    items: [
      { label: 'Evaluation', path: PATHS.EVALUATION, icon: ClipboardCheck },
      { label: 'Results', path: PATHS.RESULTS, icon: BarChart3 },
    ],
  },
  {
    label: 'Analytics & Reports',
    items: [
      { label: 'Overview', path: PATHS.ANALYTICS, icon: Activity, end: true },
      { label: 'Student Monitoring', path: PATHS.ANALYTICS_STUDENTS, icon: Radar },
      { label: 'Exam Monitoring', path: PATHS.ANALYTICS_EXAMS, icon: LineChart },
      { label: 'Reports', path: PATHS.REPORTS, icon: Printer },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Accessibility Profiles', path: PATHS.ACCESSIBILITY_PROFILES, icon: Accessibility, isPlanned: true },
      { label: 'Settings', path: PATHS.SETTINGS, icon: Settings, roles: [USER_ROLES.ADMIN] },
    ],
  },
];

/**
 * Resolve a pathname to its nav label (used for breadcrumbs/header context).
 * Falls back to the last path segment for unmatched routes.
 */
export const getNavLabel = (pathname) => {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.path === pathname) return item.label;
    }
  }
  const segment = pathname.split('/').filter(Boolean).pop();
  if (!segment) return null;
  const pretty = segment.replace(/[-_]/g, ' ');
  return pretty.charAt(0).toUpperCase() + pretty.slice(1);
};

export default NAV_GROUPS;
