import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PATHS } from '../../routes/paths';
import { USER_ROLES } from '../../utils/constants';

export const UserMenu = ({ className = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate(PATHS.LOGIN, { replace: true });
  };

  const roleLabel = user.role === USER_ROLES.ADMIN ? 'Admin' : user.role || 'User';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="hidden sm:flex flex-col items-end leading-tight">
        <span className="text-sm font-semibold text-text-main">{user.name}</span>
        <Badge variant={user.role === USER_ROLES.ADMIN ? 'purple' : 'neutral'} size="sm">
          {roleLabel}
        </Badge>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        leftIcon={<LogOut className="w-4 h-4" aria-hidden="true" />}
        ariaLabel={`Log out ${user.name}`}
      >
        <span className="hidden md:inline">Logout</span>
      </Button>
    </div>
  );
};

export default UserMenu;
