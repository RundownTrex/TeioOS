import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Pencil } from 'lucide-react';

import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { PageSkeleton } from '../../../components/ui/PageSkeleton';
import { ErrorState } from '../../../components/ui/ErrorState';

import { studentsApi } from '../api/studentsApi';
import { useClassesReference, buildClassNameMap } from '../../classes/hooks/useClassesReference';
import { useDepartmentsReference, buildDepartmentNameMap } from '../../departments/hooks/useDepartmentsReference';
import { queryKeys } from '../../../utils/queryKeys';
import {
  ACCESSIBILITY_PROFILE_OPTIONS,
  ACCESSIBILITY_PROFILE_DESCRIPTIONS,
} from '../../../utils/constants';
import { formatDate, formatDateTime } from '../../../utils/formatters';
import { PATHS } from '../../../routes/paths';

const BACK_LINK =
  'inline-flex items-center gap-1 text-sm text-text-muted hover:text-navy-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary mb-4';

const PROFILE_LABELS = ACCESSIBILITY_PROFILE_OPTIONS.reduce(
  (map, option) => ({ ...map, [option.value]: option.label }),
  {}
);

const DetailRow = ({ label, children }) => (
  <div className="grid grid-cols-3 gap-4 py-2.5 border-b border-border-main last:border-0">
    <dt className="text-sm text-text-muted">{label}</dt>
    <dd className="col-span-2 text-sm text-text-main">{children}</dd>
  </div>
);

/**
 * Read-only student profile page (docs/frontend/admin-students.md §5.3).
 */
export const StudentDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const detailQuery = useQuery({
    queryKey: queryKeys.students.detail(id),
    queryFn: ({ signal }) => studentsApi.detail(id, { signal }),
    enabled: Boolean(id),
  });

  const classesQuery = useClassesReference();
  const departmentsQuery = useDepartmentsReference();
  const classNames = buildClassNameMap(classesQuery.data);
  const departmentNames = buildDepartmentNameMap(departmentsQuery.data);

  if (detailQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <ErrorState
        title="Student not found"
        message="The student you are looking for does not exist or has been removed."
        retryLabel="Back to Students"
        onRetry={() => navigate(PATHS.STUDENTS)}
      />
    );
  }

  const student = detailQuery.data;
  const classObj = classNames.get(student.class_id);
  const className = classObj
    ? departmentNames.get(classObj.department_id)
      ? `${classObj.name} · ${departmentNames.get(classObj.department_id)}`
      : classObj.name
    : '—';
  const profileLabel = PROFILE_LABELS[student.accessibility_profile] || student.accessibility_profile;

  return (
    <div className="max-w-3xl">
      <Link to={PATHS.STUDENTS} className={BACK_LINK}>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Back to Students
      </Link>

      <PageHeader
        title={student.name}
        description={`Roll number ${student.roll_number}`}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate(PATHS.studentEdit(student.id))}
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
            Edit Student
          </Button>
        }
      />

      <Card className="mb-6">
        <CardHeader>Student Information</CardHeader>
        <CardBody>
          <dl className="m-0">
            <DetailRow label="Roll Number">{student.roll_number}</DetailRow>
            <DetailRow label="Date of Birth">{formatDate(student.date_of_birth)}</DetailRow>
            <DetailRow label="Class">{className}</DetailRow>
            <DetailRow label="Status">
              {student.is_active ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="neutral">Inactive</Badge>
              )}
            </DetailRow>
            <DetailRow label="Accessibility Profile">
              <span className="font-medium">{profileLabel}</span>
              <p className="mt-1 text-xs text-text-muted">
                {ACCESSIBILITY_PROFILE_DESCRIPTIONS[student.accessibility_profile]}
              </p>
            </DetailRow>
            <DetailRow label="Created">{formatDateTime(student.created_at)}</DetailRow>
            <DetailRow label="Last Updated">{formatDateTime(student.updated_at)}</DetailRow>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Account</CardHeader>
        <CardBody>
          <p className="text-sm text-text-muted leading-relaxed">
            This student signs in to examinations with their roll number and their date of
            birth ({formatDate(student.date_of_birth)}) as the password. Change the date of
            birth in Edit to reset the password.
          </p>
        </CardBody>
      </Card>
    </div>
  );
};

export default StudentDetailPage;
