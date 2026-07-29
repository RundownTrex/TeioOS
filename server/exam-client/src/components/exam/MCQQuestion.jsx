import React from 'react';
import { RadioGroup } from '../common/RadioGroup';

export const MCQQuestion = ({ question, value, onChange }) => {
  const selectedOptionId = value?.selected_option_id || null;

  const handleSelect = (optionId) => {
    onChange({
      question_id: question.id,
      selected_option_id: optionId,
      answer_text: null,
    });
  };

  return (
    <div className="space-y-4">
      <RadioGroup
        name={`question-${question.id}`}
        legendText="Select one option:"
        options={question.options || []}
        value={selectedOptionId}
        onChange={handleSelect}
      />
    </div>
  );
};
