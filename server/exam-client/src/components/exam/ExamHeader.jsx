import React from 'react';
import { ExamTimer } from './ExamTimer';
import { AutoSaveStatus } from './AutoSaveStatus';
import { AccessibilityToolbar } from '../accessibility/AccessibilityToolbar';
import { Shield } from 'lucide-react';

export const ExamHeader = ({ examTitle = 'Examination Session', endTime, onTimerExpire, syncStatus }) => {
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-xs px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: Branding & Exam Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-lg">
            <Shield className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100 leading-tight">
              {examTitle}
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">TeioOS Kiosk Environment</p>
          </div>
        </div>

        {/* Middle: Timer & AutoSave status */}
        <div className="flex items-center gap-3">
          <AutoSaveStatus status={syncStatus} />
          <ExamTimer endTime={endTime} onExpire={onTimerExpire} />
        </div>

        {/* Right: Accessibility Controls */}
        <div>
          <AccessibilityToolbar />
        </div>
      </div>
    </header>
  );
};
