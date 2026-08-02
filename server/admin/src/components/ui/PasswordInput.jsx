import React, { forwardRef } from 'react';
import { Input } from './Input';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Password field with a visibility toggle.
 * Props: all Input props, plus toggleAriaLabel override.
 */
export const PasswordInput = forwardRef(({ toggleAriaLabel = 'Toggle password visibility', ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const toggleButton = (
    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      className="p-1 text-text-muted hover:text-text-main focus-visible:outline-none rounded transition-colors"
    >
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <Input
      ref={ref}
      {...props}
      type={showPassword ? 'text' : 'password'}
      rightIcon={toggleButton}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
