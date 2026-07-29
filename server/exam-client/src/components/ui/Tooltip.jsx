import React, { useState } from 'react';

export const Tooltip = ({
  content,
  children,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = `tooltip-${Math.random().toString(36).substring(2, 9)}`;

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      <div aria-describedby={isVisible ? tooltipId : undefined}>
        {children}
      </div>

      {isVisible && content && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute z-announcer px-2.5 py-1.5 text-xs font-medium bg-text-main text-text-inverse rounded shadow-md pointer-events-none whitespace-nowrap transition-opacity duration-150 ${
            positions[position] || positions.top
          } ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
