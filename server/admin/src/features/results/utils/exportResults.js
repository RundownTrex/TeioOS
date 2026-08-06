import { downloadCsv } from '../../../utils/downloadCsv';
import { formatDateTime, formatNumber, formatPercent } from '../../../utils/formatters';

/**
 * Utility to export candidate examination results to CSV / Excel compatible format.
 * Includes UTF-8 BOM for seamless Microsoft Excel compatibility.
 */
export const exportResultsToCsv = ({
  results = [],
  classMap = new Map(),
  subjectMap = new Map(),
  filenamePrefix = 'results-export',
}) => {
  const headers = [
    'Candidate Name',
    'Roll Number',
    'Class',
    'Examination Title',
    'MCQ Score (pts)',
    'Descriptive Score (pts)',
    'Total Obtained Marks',
    'Exam Max Marks',
    'Percentage',
    'Grade',
    'Evaluation Status',
    'Publication Status',
    'Published Date',
  ];

  const rows = results.map((row) => {
    const student = row.student_exam?.student;
    const examSchedule = row.student_exam?.exam_schedule;
    const exam = examSchedule?.exam;
    const classObj = student?.class_id ? classMap.get(student.class_id) : null;
    const className = classObj ? classObj.name : '—';
    const subjectName = exam ? subjectMap.get(exam.subject_id)?.name : null;
    const examTitle = exam?.title || subjectName || 'Exam';

    return [
      student?.name ?? '—',
      student?.roll_number ?? '—',
      className,
      examTitle,
      formatNumber(row.mcq_score ?? 0, { minFractionDigits: 1 }),
      formatNumber(row.descriptive_score ?? 0, { minFractionDigits: 1 }),
      formatNumber(row.obtained_marks, { minFractionDigits: 1 }),
      exam?.total_marks ?? 0,
      formatPercent(row.percentage),
      row.grade ?? '—',
      row.evaluation_status,
      row.published_at ? 'Published' : 'Unpublished',
      row.published_at ? formatDateTime(row.published_at) : '—',
    ];
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${filenamePrefix}-${timestamp}.csv`;

  downloadCsv(filename, headers, rows);
};

export default exportResultsToCsv;
