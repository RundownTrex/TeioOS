import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Screen 16: Not Found (404)
 */
export const NotFoundPage = () => {
  const navigate = useNavigate();
  useDocumentTitle('Page Not Found');

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas text-text-main p-4 select-none">
      <Card className="max-w-[440px] w-full border-border-main bg-surface shadow-md text-center">
        <CardHeader className="py-6 bg-subtle/40 border-b border-border-main">
          <div className="inline-flex p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-xs mb-2">
            <AlertCircle className="w-8 h-8" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-extrabold text-text-main tracking-tight uppercase">
            404 — PAGE NOT FOUND
          </h1>
        </CardHeader>

        <CardBody className="p-6 space-y-5">
          <p className="text-xs text-text-muted leading-relaxed">
            The requested examination view or resource does not exist.
          </p>

          <Button
            variant="primary"
            size="lg"
            fullWidth={true}
            onClick={() => navigate('/dashboard')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            ariaLabel="Return to Dashboard"
          >
            Return to Dashboard
          </Button>
        </CardBody>
      </Card>
    </div>
  );
};

export default NotFoundPage;
