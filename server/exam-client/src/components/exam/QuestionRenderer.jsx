import React from 'react';
import { MCQRenderer } from './MCQRenderer';
import { DescriptiveRenderer } from './DescriptiveRenderer';

export const QuestionRenderer = ({
  questionText = '',
  questionType = 'MCQ',
  questionId,
  options = [],
  selectedOptionId,
  answerText = '',
  maxWords = 500,
  maxLength = 2500,
  onSelectOption,
  onChangeAnswerText,
  isDisabled = false,
  className = '',
}) => {
  const questionName = questionId ? `mcq-${questionId}` : 'mcq-options';
  const normalizedType = String(questionType).toUpperCase();
  const isMcq =
    normalizedType === 'MCQ' ||
    normalizedType === 'OBJECTIVE' ||
    normalizedType === 'SINGLE_SELECT';

  return (
    <div className={`flex flex-col gap-4 my-3 ${className}`}>
      {/* Question Stem Text Reading Container */}
      <div className="p-4 sm:p-5 bg-subtle/60 border border-border-main rounded-xl text-lg leading-relaxed text-text-main font-sans max-w-reading">
        <p className="whitespace-pre-line">{questionText}</p>
      </div>

      {/* Dynamic Question Renderer Switching */}
      {isMcq ? (
        <MCQRenderer
          questionName={questionName}
          options={options}
          selectedOptionId={selectedOptionId}
          onSelectOption={onSelectOption}
          isDisabled={isDisabled}
        />
      ) : (
        <DescriptiveRenderer
          answerText={answerText}
          onChangeAnswerText={onChangeAnswerText}
          isDisabled={isDisabled}
          maxLength={maxLength}
          maxWords={maxWords}
        />
      )}
    </div>
  );
};

export default QuestionRenderer;
