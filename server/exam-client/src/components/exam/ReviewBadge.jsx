import React from 'react';
import { Bookmark } from 'lucide-react';

export const ReviewBadge = ({ isReview = false, className = '' }) => {
  if (!isReview) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-800 select-none ${className}`}
    >
      <Bookmark className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
      <span>Marked for Review</span>
    </span>
  );
};

export default ReviewBadge;
