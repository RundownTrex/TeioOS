import React from 'react';

export const Card = ({
  children,
  variant = 'default',
  className = '',
  onClick,
  tabIndex,
  ...props
}) => {
  const variants = {
    default:  'bg-surface border border-border-main text-text-main shadow-sm',
    outlined: 'bg-surface border-2 border-border-strong text-text-main',
    elevated: 'bg-surface border border-border-main text-text-main shadow-md',
  };

  const isClickable = Boolean(onClick);

  const handleKeyDown = (e) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? (tabIndex ?? 0) : tabIndex}
      className={`rounded-xl overflow-hidden transition-all duration-normal ease-in-out ${variants[variant] || variants.default} ${
        isClickable
          ? 'cursor-pointer hover:border-navy-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary focus-visible:ring-offset-2'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-5 py-4 border-b border-border-main font-semibold text-text-main ${className}`}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`p-5 text-text-main ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`px-5 py-4 border-t border-border-main bg-subtle/50 text-text-main ${className}`}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
