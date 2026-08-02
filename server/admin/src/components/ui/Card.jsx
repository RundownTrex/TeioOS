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

  // Clickable cards are activation targets: Enter/Space must work like a click.
  const handleKeyDown = (event) => {
    if (!isClickable) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.(event);
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? (tabIndex ?? 0) : tabIndex}
      className={`rounded-xl overflow-hidden transition-all duration-normal ease-in-out ${variants[variant] || variants.default} ${
        isClickable ? 'cursor-pointer hover:border-navy-primary' : ''
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
  <div className={`px-5 py-4 border-t border-border-main bg-subtle text-text-main ${className}`}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
