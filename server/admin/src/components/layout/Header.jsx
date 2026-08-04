import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Breadcrumb } from '../ui/Breadcrumb';
import { UserMenu } from './UserMenu';
import { getNavLabel } from './navConfig';
import { PATHS } from '../../routes/paths';

/**
 * Sticky application bar: menu trigger, breadcrumb, theme toggle, user menu.
 * Props: onMenuClick, className.
 */
export const Header = ({ onMenuClick, className = '' }) => {
  const location = useLocation();
  const currentLabel = getNavLabel(location.pathname);

  return (
    <header
      className={`sticky top-0 z-header h-header shrink-0 bg-surface border-b border-border-main px-4 lg:px-6 flex items-center gap-3 ${className}`}
    >
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className="inline-flex items-center justify-center p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-subtle transition-colors lg:hidden"
      >
        <Menu className="w-5 h-5" aria-hidden="true" />
      </button>

      <Breadcrumb
        items={[
          { label: 'TeioOS Admin', to: PATHS.DASHBOARD },
          { label: currentLabel || location.pathname },
        ]}
        className="flex-1 min-w-0"
      />

      <div className="flex items-center gap-1.5">
        <UserMenu />
      </div>
    </header>
  );
};

export default Header;
