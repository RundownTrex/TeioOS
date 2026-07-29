import React from 'react';
import { Button } from '../ui/Button';
import { Send } from 'lucide-react';

export const SubmitButton = ({
  onSubmit,
  isDisabled = false,
  isLoading = false,
  className = '',
}) => {
  return (
    <Button
      variant="primary"
      size="lg"
      fullWidth
      onClick={onSubmit}
      isDisabled={isDisabled}
      isLoading={isLoading}
      leftIcon={<Send className="w-4 h-4" />}
      ariaLabel="Submit Examination Paper (Final Submission)"
      className={`font-bold tracking-wide shadow-md ${className}`}
    >
      SUBMIT EXAMINATION
    </Button>
  );
};

export default SubmitButton;
