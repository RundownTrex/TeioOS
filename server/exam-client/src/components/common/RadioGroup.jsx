import React from 'react';

export const RadioGroup = ({ name, options = [], value, onChange, label, legendText }) => {
  return (
    <fieldset className="space-y-3">
      <legend className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-3">
        {legendText || label}
      </legend>
      <div className="space-y-2">
        {options.map((option, index) => {
          const isSelected = String(value) === String(option.id);
          const optionId = `${name}-option-${option.id || index}`;

          return (
            <label
              key={option.id || index}
              htmlFor={optionId}
              className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-500'
                  : 'border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
              }`}
            >
              <input
                type="radio"
                id={optionId}
                name={name}
                value={option.id}
                checked={isSelected}
                onChange={() => onChange(option.id)}
                className="mt-1 h-5 w-5 text-blue-600 border-gray-300 focus-visible-ring"
              />
              <div className="ml-3 text-base text-gray-800 dark:text-slate-200">
                {option.text || option.option_text}
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};
