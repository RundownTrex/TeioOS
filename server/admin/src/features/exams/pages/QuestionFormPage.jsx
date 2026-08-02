import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';

import { Card, CardBody, CardFooter } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { PageSkeleton } from '../../../components/ui/PageSkeleton';
import { ErrorState } from '../../../components/ui/ErrorState';

import { examsApi } from '../api/examsApi';
import { questionsApi } from '../api/questionsApi';
import { useSubjectsReference, buildSubjectNameMap } from '../../subjects/hooks/useSubjectsReference';
import { useForm } from '../../../hooks/useForm';
import { useToast } from '../../../hooks/useToast';
import { queryKeys } from '../../../utils/queryKeys';
import { formatMarks, formatNumber } from '../../../utils/formatters';
import { QUESTION_TYPES } from '../../../utils/constants';
import { PATHS } from '../../../routes/paths';

const BACK_LINK =
  'inline-flex items-center gap-1 text-sm text-text-muted hover:text-navy-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary mb-4';

const newOption = (displayOrder) => ({
  option_text: '',
  display_order: displayOrder,
  is_correct: false,
});

/**
 * Question create/edit form (docs/frontend/admin-exam-management.md §5.5).
 * Serves both MCQ (options editor) and descriptive (max characters) types
 * from one route pair; `questionId` in the URL switches to edit mode.
 */
export const QuestionFormPage = () => {
  const navigate = useNavigate();
  const { id: examId, questionId } = useParams();
  const isEdit = Boolean(questionId);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const subjectsQuery = useSubjectsReference();
  const subjectNames = buildSubjectNameMap(subjectsQuery.data);

  const examQuery = useQuery({
    queryKey: queryKeys.exams.detail(examId),
    queryFn: ({ signal }) => examsApi.detail(examId, { signal }),
  });

  const detailQuery = useQuery({
    queryKey: queryKeys.questions.detail(questionId),
    queryFn: ({ signal }) => questionsApi.detail(questionId, { signal }),
    enabled: isEdit,
  });

  const [typeChangeWarning, setTypeChangeWarning] = useState(null);
  const optionInputRefs = useRef([]);

  const form = useForm({
    initialValues: {
      question_type: QUESTION_TYPES.MCQ,
      question_text: '',
      marks: '',
      negative_marks: '',
      max_characters: '',
      options: [newOption(1), newOption(2)],
    },
    validate: (values) => {
      const errors = {};
      if (!values.question_text || !values.question_text.trim()) {
        errors.question_text = 'Question text is required.';
      }
      const marks = Number(values.marks);
      if (!values.marks || Number.isNaN(marks) || marks <= 0) {
        errors.marks = 'Enter marks greater than 0.';
      }
      if (values.question_type === QUESTION_TYPES.MCQ) {
        const negativeMarks = values.negative_marks === '' ? 0 : Number(values.negative_marks);
        if (Number.isNaN(negativeMarks) || negativeMarks < 0) {
          errors.negative_marks = 'Negative marks cannot be negative.';
        }
        if (values.options.length < 2) {
          errors.options = 'MCQ questions need at least two options.';
        } else if (values.options.some((option) => !option.option_text.trim())) {
          errors.options = 'Every option needs text.';
        } else if (values.options.filter((option) => option.is_correct).length !== 1) {
          errors.options = 'Select exactly one correct option.';
        }
      } else {
        const maxCharacters = values.max_characters === '' ? null : Number(values.max_characters);
        if (maxCharacters !== null && (Number.isNaN(maxCharacters) || maxCharacters <= 0)) {
          errors.max_characters = 'Enter a limit greater than 0 characters.';
        }
      }
      return errors;
    },
    onSubmit: async (values) => {
      const isMCQ = values.question_type === QUESTION_TYPES.MCQ;
      const payload = {
        question_text: values.question_text.trim(),
        question_type: values.question_type,
        marks: Number(values.marks),
        exam_id: examId,
      };
      if (isMCQ) {
        payload.negative_marks = values.negative_marks === '' ? 0 : Number(values.negative_marks);
        payload.options = values.options.map((option, index) => ({
          option_text: option.option_text.trim(),
          display_order: index + 1,
          is_correct: Boolean(option.is_correct),
        }));
      } else {
        const maxCharacters = values.max_characters === '' ? null : Number(values.max_characters);
        if (maxCharacters !== null) payload.max_characters = maxCharacters;
      }

      if (isEdit) {
        await questionsApi.update(questionId, payload);
      } else {
        await questionsApi.create(payload);
      }
      toast(isEdit ? 'Question updated' : 'Question created', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.list.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.detail(examId) });
      navigate(PATHS.examDetail(examId));
    },
  });

  useEffect(() => {
    if (isEdit && detailQuery.data) {
      const question = detailQuery.data;
      const isMCQ = question.question_type === QUESTION_TYPES.MCQ;
      form.reset({
        question_type: question.question_type,
        question_text: question.question_text,
        marks: String(question.marks),
        negative_marks: isMCQ ? String(question.negative_marks ?? 0) : '',
        max_characters: !isMCQ && question.max_characters ? String(question.max_characters) : '',
        options: isMCQ
          ? question.options
              .slice()
              .sort((a, b) => a.display_order - b.display_order)
              .map((option, index) => ({
                option_text: option.option_text,
                display_order: index + 1,
                is_correct: option.is_correct,
              }))
          : [newOption(1), newOption(2)],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, detailQuery.data]);

  if ((isEdit && detailQuery.isLoading) || examQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (examQuery.isError) {
    return (
      <ErrorState
        title="Exam not found"
        message="The exam does not exist or has been removed."
        retryLabel="Back to Exams"
        onRetry={() => navigate(PATHS.EXAMS)}
      />
    );
  }

  if (isEdit && detailQuery.isError) {
    return (
      <ErrorState
        title="Question not found"
        message="The question does not exist or has been removed."
        retryLabel="Back to Exam"
        onRetry={() => navigate(PATHS.examDetail(examId))}
      />
    );
  }

  const exam = examQuery.data;
  const subjectName = subjectNames.get(exam?.subject_id)?.name;
  const examTitle = exam?.title || subjectName || 'Untitled exam';

  const isMCQ = form.values.question_type === QUESTION_TYPES.MCQ;
  const allocated =
    queryClient.getQueryData(queryKeys.questions.list.by({ page: 1, pageSize: 100, examId }))?.items ??
    [];
  const allocatedSum = allocated.reduce(
    (sum, question) => sum + (Number(question.marks) || 0),
    0
  );

  const setOption = (index, patch) => {
    form.setValue('options', form.values.options.map((option, i) => (i === index ? { ...option, ...patch } : option)));
  };

  const selectCorrect = (index) => {
    form.setValue(
      'options',
      form.values.options.map((option, i) => ({ ...option, is_correct: i === index }))
    );
  };

  const addOption = () => {
    form.setValue('options', [...form.values.options, newOption(form.values.options.length + 1)]);
  };

  const removeOption = (index) => {
    if (form.values.options.length <= 2) return;
    const wasCorrect = form.values.options[index].is_correct;
    const next = form.values.options.filter((_, i) => i !== index).map((option, i) => ({
      ...option,
      display_order: i + 1,
    }));
    if (wasCorrect && next.length) next[0] = { ...next[0], is_correct: true };
    form.setValue('options', next);
    const focusIndex = Math.min(index, next.length - 1);
    requestAnimationFrame(() => optionInputRefs.current?.[focusIndex]?.focus());
  };

  const onTypeChange = (nextType) => {
    if (nextType === form.values.question_type) return;
    const switchingToMCQ = nextType === QUESTION_TYPES.MCQ;
    const hasContent = form.values.question_text.trim() || form.values.marks;
    if (isEdit && hasContent && !switchingToMCQ && form.values.options.some((o) => o.option_text.trim())) {
      setTypeChangeWarning(
        'Switching to descriptive removes the current MCQ options. Your question text and marks are kept.'
      );
    } else if (isEdit && switchingToMCQ) {
      setTypeChangeWarning(
        'Switching to MCQ requires setting the options and the correct answer again.'
      );
    } else {
      setTypeChangeWarning(null);
    }
    form.setValue('question_type', nextType);
  };

  return (
    <div className="max-w-3xl">
      <Link to={PATHS.examDetail(examId)} className={BACK_LINK}>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Back to {examTitle}
      </Link>

      <PageHeader
        title={isEdit ? 'Edit Question' : 'New Question'}
        description={`${examTitle} · ${formatNumber(exam?.total_marks)} total marks`}
      />

      <Card>
        <form onSubmit={form.handleSubmit} noValidate>
          <CardBody className="space-y-4">
            {form.submitError && <Alert variant="error">{form.submitError}</Alert>}

            <fieldset>
              <legend className="text-sm font-medium text-text-main">Question type</legend>
              <div className="mt-2 flex flex-wrap gap-4">
                {[
                  { value: QUESTION_TYPES.MCQ, label: 'MCQ', hint: 'Options with one correct answer' },
                  { value: QUESTION_TYPES.DESCRIPTIVE, label: 'Descriptive', hint: 'Free-text answer, evaluated manually' },
                ].map((option) => (
                  <label key={option.value} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="question_type"
                      value={option.value}
                      checked={form.values.question_type === option.value}
                      onChange={(event) => onTypeChange(event.target.value)}
                      className="mt-1 h-4 w-4 accent-navy-primary"
                    />
                    <span>
                      <span className="block text-sm font-medium text-text-main">{option.label}</span>
                      <span className="block text-xs text-text-muted">{option.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
              {typeChangeWarning && (
                <Alert variant="warning" className="mt-3">{typeChangeWarning}</Alert>
              )}
            </fieldset>

            <Textarea
              name="question_text"
              label="Question"
              value={form.values.question_text ?? ''}
              onChange={(event) => form.setValue('question_text', event.target.value)}
              error={form.errors.question_text}
              placeholder="Type the question…"
              rows={3}
              isRequired
              autoFocus
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="marks"
                label="Marks"
                type="number"
                min="0.5"
                step="0.5"
                value={form.values.marks ?? ''}
                onChange={(event) => form.setValue('marks', event.target.value)}
                error={form.errors.marks}
                helperText={`Exam total ${formatNumber(exam?.total_marks)} · ${formatMarks(allocatedSum)} allocated`}
                isRequired
              />
              {isMCQ ? (
                <Input
                  name="negative_marks"
                  label="Negative Marks"
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.values.negative_marks ?? ''}
                  onChange={(event) => form.setValue('negative_marks', event.target.value)}
                  error={form.errors.negative_marks}
                  helperText="Deducted for a wrong answer (MCQ only)."
                />
              ) : (
                <Input
                  name="max_characters"
                  label="Max Characters"
                  type="number"
                  min="1"
                  step="1"
                  value={form.values.max_characters ?? ''}
                  onChange={(event) => form.setValue('max_characters', event.target.value)}
                  error={form.errors.max_characters}
                  helperText="Optional character limit for the answer."
                />
              )}
            </div>

            {isMCQ && (
              <div className="rounded-lg border border-border-main">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-main">
                  <div>
                    <p className="text-sm font-medium text-text-main">Options</p>
                    <p className="text-xs text-text-muted">
                      Select the correct answer; at least two options are required.
                    </p>
                  </div>
                  <Button variant="outline" onClick={addOption}>
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    Add Option
                  </Button>
                </div>
                <ul className="divide-y divide-border-main">
                  {form.values.options.map((option, index) => (
                    <li key={index} className="flex items-center gap-3 px-4 py-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="correct_option"
                          checked={Boolean(option.is_correct)}
                          onChange={() => selectCorrect(index)}
                          aria-label={`Mark option ${index + 1} as correct`}
                          className="h-4 w-4 accent-emerald-600"
                        />
                        <span className="text-xs font-semibold uppercase text-text-muted w-4">
                          {String.fromCharCode(65 + index)}.
                        </span>
                      </label>
                      <Input
                        name={`options[${index}].option_text`}
                        ariaLabel={`Option ${index + 1} text`}
                        value={option.option_text ?? ''}
                        onChange={(event) => setOption(index, { option_text: event.target.value })}
                        placeholder={`Option ${index + 1} text…`}
                        ref={(element) => {
                          optionInputRefs.current[index] = element;
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        aria-label={`Remove option ${index + 1}`}
                        onClick={() => removeOption(index)}
                        isDisabled={form.values.options.length <= 2}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
                {form.errors.options && (
                  <p className="px-4 py-2 text-xs text-danger-main" role="alert">
                    {form.errors.options}
                  </p>
                )}
              </div>
            )}
          </CardBody>

          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(PATHS.examDetail(examId))}
              isDisabled={form.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={form.isSubmitting}>
              {isEdit ? 'Save Question' : 'Create Question'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default QuestionFormPage;
