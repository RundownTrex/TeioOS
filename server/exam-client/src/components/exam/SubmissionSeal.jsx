import React from 'react';
import { Check } from 'lucide-react';

/**
 * SubmissionSeal — The single deliberate ceremonial moment in TeioOS (DESIGN.md §5)
 *
 * A physical stamp-seal confirmation:
 * - Circular mark in --teio-seal (#7C2D2D)
 * - Roughly 96px diameter (w-24 h-24)
 * - Single ring with checkmark and 'SUBMITTED' text inside
 * - Deliberate press-down motion (scale 1.15 -> 1.0 with slight overshoot, ~280ms ease-out)
 * - Respects prefers-reduced-motion and data-reduced-motion via tokens.css
 */
export const SubmissionSeal = ({
  size = 96,
  statusText = 'SUBMITTED',
  subText = 'TEIOOS RECORD',
  animate = true,
  className = '',
}) => {
  return (
    <div
      role="img"
      aria-label={`Official examination submission seal: ${statusText}`}
      className={`inline-flex items-center justify-center select-none ${className}`}
    >
      <div
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`w-24 h-24 rounded-full border-2 border-seal bg-surface/90 flex flex-col items-center justify-center p-2 text-seal relative shadow-none ${
          animate ? 'animate-stamp-seal' : ''
        }`}
      >
        {/* Subtle decorative inner dash line or clean institutional layout */}
        <span className="font-mono text-[8px] font-semibold text-seal/80 tracking-widest uppercase leading-none mb-1">
          {subText}
        </span>
        <Check className="w-7 h-7 text-seal stroke-[2.5]" aria-hidden="true" />
        <span className="font-mono text-[10px] font-bold tracking-wider text-seal uppercase leading-none mt-1">
          {statusText}
        </span>
      </div>
    </div>
  );
};

export default SubmissionSeal;
