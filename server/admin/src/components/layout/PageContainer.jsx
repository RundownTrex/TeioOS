import React from 'react';

/**
 * Page-level width + gutter wrapper.
 * Props: as (element), maxWidth (Tailwind max-w-* token), className, children.
 */
export const PageContainer = ({
  as: Tag = 'div',
  maxWidth = 'max-w-workbench',
  className = '',
  children,
  ...props
}) => (
  <Tag
    className={`w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 ${maxWidth} ${className}`}
    {...props}
  >
    {children}
  </Tag>
);

export default PageContainer;
