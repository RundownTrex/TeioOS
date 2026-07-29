import React from 'react';
import { Shield } from 'lucide-react';
import { AccessibilityTrigger } from './AccessibilityTrigger';
import { ShortcutTrigger } from './ShortcutTrigger';
import { useAccessibility } from '../../hooks/useAccessibility';

export const Header = ({
  title = 'TEIOOS EXAM PLATFORM',
  subtitle,
  centerContent,
  rightContent,
  onOpenAccessibility,
  className = '',
}) => {
  const { openModal } = useAccessibility();
  const handleOpenAcc = onOpenAccessibility || openModal;

  return (
    <header className={`sticky top-0 z-header bg-surface border-b border-border-main py-2.5 px-4 sm:px-6 shadow-sm select-none ${className}`}>
      <div className="w-full mx-auto flex items-center justify-between gap-4">
        {/* Left System Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-1.5 bg-navy-primary text-text-inverse rounded-md">
            <Shield className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-text-main leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Center Slot (e.g. Active Exam Timer Container) */}
        {centerContent && (
          <div className="flex-1 flex justify-center max-w-md mx-auto">
            {centerContent}
          </div>
        )}

        {/* Right Actions Slot: Shortcut & Accessibility Triggers */}
        <div className="flex items-center gap-3 shrink-0">
          {rightContent}
          <div className="flex items-center gap-2 pl-2 border-l border-border-main">
            <ShortcutTrigger />
            <AccessibilityTrigger onClick={handleOpenAcc} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
