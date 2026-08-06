import React from 'react';

export const DashboardSection = ({
  id,
  title,
  action,
  headingRef,
  className = '',
  children,
}) => {
  const headingId = id ? `${id}-heading` : undefined;

  return (
    <section aria-labelledby={headingId} className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h2
          id={headingId}
          ref={headingRef}
          tabIndex={headingRef ? -1 : undefined}
          className="text-base font-bold text-text-main tracking-tight uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-2 rounded"
        >
          {title}
        </h2>
        {action && <div>{action}</div>}
      </div>
      {children}
    </section>
  );
};

export default DashboardSection;
