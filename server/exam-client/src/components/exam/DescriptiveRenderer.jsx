import React, { useRef } from 'react';
import { TextArea } from '../ui/TextArea';
import { STTDictationControl } from '../accessibility/STTDictationControl';

export const DescriptiveRenderer = ({
  answerText = '',
  onChangeAnswerText,
  isDisabled = false,
  maxLength = 2500,
  maxWords = 500,
  placeholder = 'Type your detailed descriptive response here or use Speech Dictation (Alt+D)...',
  className = '',
}) => {
  const textareaRef = useRef(null);

  return (
    <div className={`my-3 flex flex-col gap-3.5 ${className}`}>
      {/* Speech-to-Text Dictation Control Panel (Descriptive Questions Only) */}
      <STTDictationControl
        textareaRef={textareaRef}
        value={answerText}
        onChange={onChangeAnswerText}
      />

      {/* Main Descriptive Answer Large Text Editor */}
      <TextArea
        ref={textareaRef}
        id="descriptive-answer-textarea"
        name="descriptiveAnswer"
        label="Descriptive Answer Editor:"
        value={answerText}
        onChange={(e) => onChangeAnswerText && onChangeAnswerText(e.target.value)}
        placeholder={placeholder}
        rows={9}
        showWordCount={true}
        maxLength={maxLength}
        maxWords={maxWords}
        isDisabled={isDisabled}
      />
    </div>
  );
};

export default DescriptiveRenderer;
