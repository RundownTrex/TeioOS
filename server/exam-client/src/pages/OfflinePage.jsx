import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { WifiOff, RefreshCw, HardDrive, Clock, CheckCircle } from 'lucide-react';
import { useTTS } from '../hooks/useTTS';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Screen 12: Network Lost / Offline Mode
 */
export const OfflinePage = () => {
  const navigate = useNavigate();
  const [retrySeconds, setRetrySeconds] = useState(5);
  const [isRetrying, setIsRetrying] = useState(false);
  const { speakText } = useTTS();

  useDocumentTitle('Server Disconnected');

  useEffect(() => {
    const prompt = 'Server connection interrupted. Working in local cache mode. All responses are safe on this terminal.';
    speakText(prompt, 'Offline Notice');
  }, [speakText]);

  // Auto-retry ticker (5 seconds countdown)
  useEffect(() => {
    const timer = setInterval(() => {
      setRetrySeconds((prev) => {
        if (prev <= 1) {
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleManualRetry = () => {
    setIsRetrying(true);
    speakText('Retrying server connection...', 'Retry');
    setTimeout(() => {
      setIsRetrying(false);
      navigate(-1); // Return to previous active exam page
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas text-text-main p-4 select-none">
      <Card className="max-w-[520px] w-full border-amber-300 bg-surface shadow-md">
        <CardHeader className="text-center py-6 bg-amber-50 border-b border-amber-200">
          <div className="inline-flex p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-xs mb-2">
            <WifiOff className="w-8 h-8" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-extrabold text-amber-950 tracking-tight uppercase">
            SERVER DISCONNECTED
          </h1>
          <span className="text-xs font-mono font-semibold text-amber-700 mt-1 block">
            [!] WORKING IN LOCAL CACHE MODE │ RETRYING IN {String(retrySeconds).padStart(2, '0')}s
          </span>
        </CardHeader>

        <CardBody className="p-6 space-y-5">
          <ul className="space-y-2.5 text-xs text-text-main leading-relaxed font-medium">
            <li className="flex items-start gap-2.5">
              <HardDrive className="w-4 h-4 text-navy-primary shrink-0 mt-0.5" aria-hidden="true" />
              <span>All responses are saved locally on terminal storage.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>Exam countdown timer continues to run accurately.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>You may continue answering questions without interruption.</span>
            </li>
          </ul>

          <Button
            variant="primary"
            size="lg"
            fullWidth={true}
            isLoading={isRetrying}
            onClick={handleManualRetry}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            ariaLabel="Retry Connection Now"
          >
            Retry Connection Now
          </Button>
        </CardBody>
      </Card>
    </div>
  );
};

export default OfflinePage;
