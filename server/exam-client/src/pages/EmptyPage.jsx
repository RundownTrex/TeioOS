import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { AuthLayout } from '../layouts/AuthLayout';

/**
 * Screen 14: Empty States
 */
export const EmptyPage = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <div className="max-w-[600px] mx-auto my-8 select-none">
        <EmptyState
          title="NO ITEMS AVAILABLE"
          description="There are no questions or examination schedule items available in this section."
          actionLabel="Return to Dashboard"
          onAction={() => navigate('/dashboard')}
        />
      </div>
    </AuthLayout>
  );
};

export default EmptyPage;
