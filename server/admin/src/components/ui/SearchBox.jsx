import React, { forwardRef, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './Input';
import { IconButton } from './IconButton';

/**
 * Search field with debounced change notification and clear button.
 * Props: value, onChange, onDebouncedChange, delay, placeholder, ariaLabel,
 *        leftIcon, isDisabled, className.
 */
export const SearchBox = forwardRef(
  (
    {
      value,
      onChange,
      onDebouncedChange,
      delay = 300,
      placeholder = 'Search…',
      ariaLabel = 'Search',
      leftIcon,
      isDisabled = false,
      className = '',
    },
    ref
  ) => {
    const hasValue = Boolean(value && String(value).length > 0);
    const skipFirst = useRef(true);

    useEffect(() => {
      if (skipFirst.current) {
        skipFirst.current = false;
        return;
      }

      const timer = setTimeout(() => {
        if (onDebouncedChange) onDebouncedChange(value || '');
      }, delay);

      return () => clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, delay]);

    const clear = () => {
      if (onChange) onChange('');
      if (onDebouncedChange) onDebouncedChange('');
    };

    return (
      <div role="search" className={className}>
        <Input
          ref={ref}
          type="text"
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          ariaLabel={ariaLabel}
          isDisabled={isDisabled}
          inputClassName={hasValue ? 'pr-12' : ''}
          leftIcon={leftIcon || <Search className="w-4 h-4" aria-hidden="true" />}
          rightIcon={
            hasValue ? (
              <IconButton
                type="button"
                size="sm"
                label="Clear search"
                icon={<X className="w-4 h-4" aria-hidden="true" />}
                onClick={clear}
              />
            ) : undefined
          }
        />
      </div>
    );
  }
);

SearchBox.displayName = 'SearchBox';

export default SearchBox;
