import React from 'react';
import { HighContrastToggle } from './HighContrastToggle';
import { FontSizeScaler } from './FontSizeScaler';
import { TTSSpeaker } from './TTSSpeaker';
import { STTInput } from './STTInput';

export const AccessibilityToolbar = ({ className = '' }) => {
  return (
    <div
      role="region"
      aria-label="Accessibility options toolbar"
      className={`flex flex-wrap items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm ${className}`}
    >
      <HighContrastToggle />
      <FontSizeScaler />
      <TTSSpeaker />
      <STTInput />
    </div>
  );
};
