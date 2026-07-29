import React from 'react';

export const SkipLinks = ({
  links = [
    { targetId: 'main-content', label: 'Skip to main examination content' },
    { targetId: 'skip-to-palette', label: 'Skip to question palette grid' },
    { targetId: 'skip-to-accessibility', label: 'Skip to accessibility preferences' },
  ],
}) => {
  return (
    <nav aria-label="Skip links navigation" className="relative z-skip-link">
      <div className="flex flex-col gap-1 absolute top-2 left-2">
        {links.map((link) => (
          <a
            key={link.targetId}
            href={`#${link.targetId}`}
            className="sr-only focus:not-sr-only focus:inline-block focus:px-4 focus:py-2.5 focus:bg-navy-primary focus:text-text-inverse focus:font-semibold focus:rounded-md focus:shadow-lg focus:outline-none border-2 border-white"
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
};

export default SkipLinks;
