import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown, Palette } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui/Badge';
import { ThemeToggle } from './ThemeToggle';
import { PATHS } from '../../routes/paths';
import { USER_ROLES } from '../../utils/constants';

export const UserMenu = ({ className = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate(PATHS.LOGIN, { replace: true });
  };

  const roleLabel = user.role === USER_ROLES.ADMIN ? 'Admin' : user.role === 'teacher' ? 'Teacher' : user.role || 'User';

  return (
    <div ref={menuRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`User menu for ${user.name}`}
        className="inline-flex items-center gap-2 p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary"
      >
        <div className="w-8 h-8 rounded-full bg-navy-tint text-navy-primary font-bold flex items-center justify-center text-xs shrink-0 border border-navy-primary/20">
          {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
        </div>
        <div className="hidden sm:flex flex-col items-start text-left leading-tight">
          <span className="text-xs font-semibold text-text-main">{user.name}</span>
          <span className="text-[10px] text-text-muted">{roleLabel}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-fast ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 py-2 bg-surface border border-border-main rounded-xl shadow-lg z-dropdown animate-fadeIn"
        >
          {/* User Details Header */}
          <div className="px-4 py-2.5 border-b border-border-main flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-navy-tint text-navy-primary font-bold flex items-center justify-center text-sm shrink-0 border border-navy-primary/20">
              {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-semibold text-text-main truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant={user.role === USER_ROLES.ADMIN ? 'purple' : user.role === 'teacher' ? 'info' : 'neutral'} size="sm">
                  {roleLabel}
                </Badge>
                {user.email && (
                  <span className="text-[11px] text-text-muted truncate max-w-[110px]" title={user.email}>
                    {user.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Theme Selector Section */}
          <div className="px-4 py-2.5 border-b border-border-main">
            <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted mb-2">
              <Palette className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Appearance</span>
            </div>
            <ThemeToggle variant="segmented" className="w-full flex" />
          </div>

          {/* Actions */}
          <div className="pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-status-danger hover:bg-status-danger-bg transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
