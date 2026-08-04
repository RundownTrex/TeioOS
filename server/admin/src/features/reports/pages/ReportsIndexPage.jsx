import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, BarChart3, ClipboardCheck } from 'lucide-react';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardBody } from '../../../components/ui/Card';
import { PATHS } from '../../../routes/paths';

const REPORTS = [
  {
    key: 'student',
    title: 'Student Results',
    description: 'Marks, grades, and evaluation status for a single student.',
    icon: FileText,
    path: PATHS.REPORT_STUDENT,
  },
  {
    key: 'exam',
    title: 'Exam Summary',
    description: 'Performance summary, pass rate, and marks distribution for an exam.',
    icon: BarChart3,
    path: PATHS.REPORT_EXAM,
  },
  {
    key: 'evaluation',
    title: 'Evaluation Summary',
    description: 'Evaluation progress and pending work for an exam.',
    icon: ClipboardCheck,
    path: PATHS.REPORT_EVALUATION,
  },
];

/**
 * Reports index (docs/frontend/admin-analytics-monitoring.md §4.4):
 * three printable report entry points.
 */
export const ReportsIndexPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Reports"
        description="Generate and print examination reports. Open a report, set its filters, then use the Print button."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Card
              key={report.key}
              role="button"
              tabIndex={0}
              aria-label={`Open ${report.title} report`}
              onClick={() => navigate(report.path)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(report.path);
                }
              }}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary cursor-pointer hover:border-navy-primary/40 transition-colors"
            >
              <CardBody className="flex flex-col gap-3 min-h-[180px]">
                <span className="text-text-muted" aria-hidden="true">
                  <Icon className="w-6 h-6" />
                </span>
                <h2 className="text-lg font-semibold text-text-main">{report.title}</h2>
                <p className="text-sm text-text-muted leading-relaxed">{report.description}</p>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </>
  );
};

export default ReportsIndexPage;
