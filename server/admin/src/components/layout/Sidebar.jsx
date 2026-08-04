import React from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES } from '../../utils/constants';
import { NAV_GROUPS } from './navConfig';

/**
 * Primary navigation sidebar; overlay drawer below lg, fixed 280px on lg+.
 * Controlled: Props: isOpen (mobile), onClose, className.
 */
export const Sidebar = ({ isOpen = false, onClose, className = '' }) => {
  const { user } = useAuth();
  const userRole = user?.role || USER_ROLES.ADMIN;

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || item.roles.includes(userRole)),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onClose}
          className="fixed inset-0 z-backdrop bg-overlay lg:hidden"
        />
      )}

      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-sidebar w-sidebar max-w-[85vw] bg-surface border-r border-border-main flex flex-col transform transition-transform duration-normal ease-in-out lg:translate-x-0 lg:static lg:z-base ${className} ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-header flex items-center justify-between px-5 border-b border-border-main shrink-0">
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-text-main text-lg tracking-wide">TeioOS</span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
              Administration
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="inline-flex items-center justify-center p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-subtle transition-colors lg:hidden"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-6">
            {visibleGroups.map((group) => (
              <li key={group.label}>
                <p className="px-2 mb-2 text-[11px] font-bold uppercase tracking-widest text-text-muted">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          end={item.end}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-navy-tint text-navy-primary border-l-[3px] border-navy-primary pl-[7px]'
                                : 'text-text-muted hover:text-text-main hover:bg-subtle'
                            }`
                          }
                        >
                          <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.isPlanned && (
                            <span
                              className="text-[10px] font-bold uppercase tracking-wide text-text-muted bg-subtle border border-border-main rounded-full px-1.5 py-0.5"
                              title="Planned feature"
                            >
                              Planned
                            </span>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-5 py-3 border-t border-border-main shrink-0">
          <p className="text-[11px] text-text-muted text-center">TeioOS Exam Server · Admin Console</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
