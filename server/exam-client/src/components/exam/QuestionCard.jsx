import React from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { QuestionHeader } from './QuestionHeader';
import { QuestionRenderer } from './QuestionRenderer';

export const QuestionCard = ({
  currentIndex = 0,
  totalQuestions = 1,
  sectionTitle,
  questionId,
  questionText = '',
  questionType = 'MCQ',
  options = [],
  marks = 1,
  negativeMarks = 0,
  maxWords = 500,
  maxLength = 2500,
  selectedOptionId,
  answerText = '',
  isMarkedForReview = false,
  onSelectOption,
  onChangeAnswerText,
  isDisabled = false,
  headingRef = null,
  className = '',
}) => {
  return (
    <Card className={`w-full border-border-main bg-surface shadow-sm ${className}`}>
      <CardHeader>
        <QuestionHeader
          currentIndex={currentIndex}
          totalQuestions={totalQuestions}
          sectionTitle={sectionTitle}
          marks={marks}
          negativeMarks={negativeMarks}
          isMarkedForReview={isMarkedForReview}
          questionText={questionText}
          headingRef={headingRef}
        />
      </CardHeader>

      <CardBody>
        <QuestionRenderer
          questionId={questionId}
          questionText={questionText}
          questionType={questionType}
          options={options}
          selectedOptionId={selectedOptionId}
          answerText={answerText}
          maxWords={maxWords}
          maxLength={maxLength}
          onSelectOption={onSelectOption}
          onChangeAnswerText={onChangeAnswerText}
          isDisabled={isDisabled}
        />
      </CardBody>
    </Card>
  );
};

export default QuestionCard;
