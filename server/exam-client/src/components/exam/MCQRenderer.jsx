import React from 'react';
import { useTTS } from '../../hooks/useTTS';

export const MCQRenderer = ({
  questionName = 'mcq-options',
  options = [],
  selectedOptionId,
  onSelectOption,
  isDisabled = false,
  className = '',
}) => {
  const { speakText } = useTTS();
  const getPrefix = (index) => String.fromCharCode(65 + index);

  const handleOptionFocus = (prefix, text) => {
    speakText(`Option ${prefix}: ${text}`);
  };

  const handleOptionSelect = (optionId, prefix, text) => {
    if (isDisabled) return;
    if (onSelectOption) onSelectOption(optionId);
    speakText(`Selected Option ${prefix}: ${text}`, 'Selection Confirmed');
  };

  return (
    <div
      role="radiogroup"
      aria-label="Multiple choice answer options"
      className={`flex flex-col gap-3 my-3 ${className}`}
    >
      {options.map((option, idx) => {
        const optionId = `${questionName}-opt-${option.id || idx}`;
        const isSelected = String(selectedOptionId) === String(option.id);
        const prefix = getPrefix(idx);
        const text = option.text || option.option_text || '';

        return (
          <label
            key={option.id || idx}
            htmlFor={optionId}
            className={`flex items-start gap-3.5 p-3.5 border rounded-lg cursor-pointer transition-all duration-normal ease-in-out select-none ${
              isSelected
                ? 'border-navy-primary bg-navy-primary/5 text-text-main font-semibold ring-1 ring-navy-primary shadow-xs'
                : 'border-border-main hover:border-border-strong hover:bg-subtle/30 bg-surface text-text-main'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="relative flex items-center justify-center mt-0.5 shrink-0">
              <input
                id={optionId}
                type="radio"
                name={questionName}
                value={option.id}
                checked={isSelected}
                disabled={isDisabled}
                onFocus={() => handleOptionFocus(prefix, text)}
                onChange={() => handleOptionSelect(option.id, prefix, text)}
                aria-label={`Option ${prefix}: ${text}`}
                className="peer sr-only"
              />
              <div
                aria-hidden="true"
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-colors duration-normal peer-focus-visible:ring-2 peer-focus-visible:ring-navy-primary peer-focus-visible:ring-offset-2 ${
                  isSelected
                    ? 'border-navy-primary bg-navy-primary text-text-inverse'
                    : 'border-border-strong text-text-muted bg-surface'
                }`}
              >
                {isSelected ? '●' : prefix}
              </div>
            </div>

            <div className="flex-1 text-base leading-relaxed">
              <span className="font-semibold mr-2" aria-hidden="true">{prefix}.</span>
              <span>{text}</span>
            </div>
          </label>
        );
      })}
    </div>
  );
};

export default MCQRenderer;
