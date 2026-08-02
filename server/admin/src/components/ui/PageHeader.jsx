import React from 'react';

export const PageHeader = ({ title, description, actions, className = '' }) => {
  return (
    <header className={`mb-6 flex flex-wrap items-start justify-between gap-4 ${className}`}>
      <div>
        <h1 className="text-2xl font-bold text-text-main">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-text-muted leading-relaxed max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
};

export default PageHeader;
