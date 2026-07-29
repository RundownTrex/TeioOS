import React from 'react';
import { Skeleton } from '../components/ui/Skeleton';
import { ExamLayout } from '../layouts/ExamLayout';

/**
 * Screen 13: Loading States
 */
export const LoadingPage = () => {
  return (
    <ExamLayout paperTitle="TEIOOS EXAM" sectionTitle="LOADING QUESTION DATA...">
      <div className="max-w-reading mx-auto space-y-6 select-none my-4">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton variant="text" width="40%" height={24} />
          <Skeleton variant="text" width="60%" height={32} />
        </div>

        {/* Stem Skeleton */}
        <Skeleton variant="rectangular" height={140} className="rounded-xl" />

        {/* Options Skeleton */}
        <div className="space-y-3 pt-2">
          <Skeleton variant="rectangular" height={52} className="rounded-xl" />
          <Skeleton variant="rectangular" height={52} className="rounded-xl" />
          <Skeleton variant="rectangular" height={52} className="rounded-xl" />
          <Skeleton variant="rectangular" height={52} className="rounded-xl" />
        </div>
      </div>
    </ExamLayout>
  );
};

export default LoadingPage;
