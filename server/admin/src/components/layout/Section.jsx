import React from 'react';

/**
 * Titled content grouping used above or between Cards.
 * Props: title, description, actions, id, className, children.
 */
export const Section = ({ title, description, actions, id, className = '', children }) => (
  <section id={id} className={className}>
    {(title || actions) && (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          {title && <h2 className="text-lg font-semibold text-text-main">{title}</h2>}
          {description && (
            <p className="mt-1 text-sm text-text-muted leading-relaxed max-w-2xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    )}
    {children}
  </section>
);

export default Section;
