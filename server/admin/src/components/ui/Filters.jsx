import React from 'react';
import { SearchBox } from './SearchBox';
import { Select } from './Select';
import { Input } from './Input';
import { Button } from './Button';

/**
 * Inline filter toolbar for collection pages.
 * Props: fields ([{ name, label, type: 'text'|'select'|'date', options, placeholder }]),
 *        values (object), onChange(name, value), onReset(), searchPlaceholder, className.
 */
export const Filters = ({
  fields = [],
  values = {},
  onChange,
  onReset,
  searchPlaceholder = 'Search…',
  className = '',
}) => {
  if (!fields.length) return null;

  const hasActiveValues = fields.some((field) => {
    const value = values[field.name];
    return value !== undefined && value !== null && String(value).length > 0;
  });

  const handleChange = (name, value) => {
    if (onChange) onChange(name, value);
  };

  return (
    <section aria-label="Filters" className={className}>
      <div className="flex flex-wrap items-center gap-3">
        {fields.map((field) => {
          if (field.type === 'select') {
            return (
              <Select
                key={field.name}
                name={field.name}
                label={field.label}
                ariaLabel={field.label}
                value={values[field.name] || ''}
                onChange={(event) => handleChange(field.name, event.target.value)}
                placeholder={field.placeholder || `All ${field.label}`}
                options={field.options || []}
                className="w-56"
              />
            );
          }

          if (field.type === 'date') {
            return (
              <Input
                key={field.name}
                type="date"
                name={field.name}
                label={field.label}
                ariaLabel={field.label}
                value={values[field.name] || ''}
                onChange={(event) => handleChange(field.name, event.target.value)}
                className="w-44"
              />
            );
          }

          return (
            <SearchBox
              key={field.name}
              value={values[field.name] || ''}
              onChange={(event) => handleChange(field.name, event.target.value)}
              onDebouncedChange={(value) => handleChange(field.name, value)}
              placeholder={field.placeholder || searchPlaceholder}
              ariaLabel={field.label || 'Search'}
              className="w-64"
            />
          );
        })}

        {hasActiveValues && onReset && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Clear Filters
          </Button>
        )}
      </div>
    </section>
  );
};

export default Filters;
