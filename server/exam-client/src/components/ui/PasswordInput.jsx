import React, { useState } from 'react';
import { Input } from './Input';
import { Eye, EyeOff } from 'lucide-react';

export const PasswordInput = ({
  toggleAriaLabel = 'Toggle password visibility',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleButton = (
    <button
      type="button"
      onClick={toggleVisibility}
      aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
      className="p-1 text-text-muted hover:text-text-main focus-visible:outline-none rounded transition-colors"
    >
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <Input
      {...props}
      type={showPassword ? 'text' : 'password'}
      rightIcon={toggleButton}
    />
  );
};

export default PasswordInput;
