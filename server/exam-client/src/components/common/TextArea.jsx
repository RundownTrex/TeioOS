import React from 'react';

export const TextArea = ({
  id,
  name,
  label,
  value = '',
  onChange,
  placeholder = 'Type your detailed response here...',
  rows = 6,
  className = '',
  ariaDescribedBy,
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-base font-medium text-gray-900 dark:text-slate-100">
          {label}
        </label>
      )}
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        aria-describedby={ariaDescribedBy}
        className={`w-full p-4 rounded-lg border-2 border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus-visible-ring resize-y ${className}`}
      />
    </div>
  );
};
