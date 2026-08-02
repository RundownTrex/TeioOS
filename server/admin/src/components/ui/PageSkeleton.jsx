import React from 'react';
import { LoadingSkeleton } from './LoadingSkeleton';

/**
 * Suspense fallback for lazy-loaded route chunks.
 */
export const PageSkeleton = ({ className = '' }) => (
  <div role="status" className={`p-6 space-y-6 ${className}`}>
    <LoadingSkeleton variant="text" width="16rem" />
    <LoadingSkeleton variant="rectangular" height="10rem" />
    <LoadingSkeleton variant="rectangular" height="16rem" />
    <span className="sr-only">Loading page...</span>
  </div>
);

export default PageSkeleton;
