import React from 'react';
import { TextArea } from '../common/TextArea';

export const DescriptiveQuestion = ({ question, value, onChange }) => {
  const answerText = value?.answer_text || '';

  const handleChange = (e) => {
    const text = e.target.value;
    onChange({
      question_id: question.id,
      selected_option_id: null,
      answer_text: text,
    });
  };

  return (
    <div className="space-y-4">
      <TextArea
        id={`question-desc-${question.id}`}
        name={`question-desc-${question.id}`}
        label="Write your detailed answer below:"
        value={answerText}
        onChange={handleChange}
        rows={8}
        placeholder="Type your explanation or response clearly..."
      />
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-slate-400">
        <span>Auto-saves as you type</span>
        <span>Character count: {answerText.length}</span>
      </div>
    </div>
  );
};
