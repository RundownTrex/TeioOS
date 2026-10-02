import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ShieldAlert } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Screen 11: Unauthorized Access
 */
export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  useDocumentTitle('Access Restricted');

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas text-text-main p-4 select-none">
      <Card className="max-w-[440px] w-full border-border-main bg-surface text-center">
        <CardHeader className="py-6 bg-status-danger-bg/40 border-b border-status-danger-border">
          <div className="inline-flex p-2.5 bg-status-danger-bg text-status-danger border border-status-danger-border rounded mb-3">
            <ShieldAlert className="w-8 h-8" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-bold font-serif text-text-main tracking-tight">
            Access Restricted
          </h1>
        </CardHeader>

        <CardBody className="p-6 space-y-5">
          <p className="text-xs text-text-muted leading-relaxed">
            You are not authorized to view this paper or resource. Please contact your hall invigilator or administrator.
          </p>

          <Button
            variant="primary"
            size="lg"
            fullWidth={true}
            onClick={() => navigate('/dashboard')}
            ariaLabel="Return to Dashboard"
          >
            Return to Dashboard
          </Button>
        </CardBody>
      </Card>
    </div>
  );
};

export default UnauthorizedPage;
