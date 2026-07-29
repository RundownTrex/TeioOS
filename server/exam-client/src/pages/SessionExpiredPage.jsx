import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Clock, LogIn } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Screen 10: Session Expired
 */
export const SessionExpiredPage = () => {
  const navigate = useNavigate();
  useDocumentTitle('Session Expired');

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas text-text-main p-4 select-none">
      <Card className="max-w-[440px] w-full border-border-main bg-surface shadow-md text-center">
        <CardHeader className="py-6 bg-subtle/40 border-b border-border-main">
          <div className="inline-flex p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-xs mb-2">
            <Clock className="w-8 h-8" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-extrabold text-text-main tracking-tight uppercase">
            SESSION EXPIRED
          </h1>
        </CardHeader>

        <CardBody className="p-6 space-y-5">
          <p className="text-xs text-text-muted leading-relaxed">
            Your examination login token has expired. Your saved answers remain safe on the server database.
          </p>

          <Button
            variant="primary"
            size="lg"
            fullWidth={true}
            onClick={() => navigate('/login', { replace: true })}
            leftIcon={<LogIn className="w-4 h-4" />}
            ariaLabel="Re-Authenticate and Continue"
          >
            Re-Authenticate &amp; Continue
          </Button>
        </CardBody>
      </Card>
    </div>
  );
};

export default SessionExpiredPage;
