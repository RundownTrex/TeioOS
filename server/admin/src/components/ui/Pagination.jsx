import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Select } from './Select';
import { IconButton } from './IconButton';

/**
 * Table pagination bar (presentational; page state lives in the URL).
 * Props: page, pageSize, total, pageSizeOptions, onPageChange, onPageSizeChange,
 *        isDisabled, labels, className.
 */
export const Pagination = ({
  page,
  pageSize,
  total = 0,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  isDisabled = false,
  labels = {},
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  const showingText = labels.showing || 'Showing {start}–{end} of {total}';
  const renderShowing = () =>
    showingText
      .replace('{start}', String(start))
      .replace('{end}', String(end))
      .replace('{total}', String(total));

  const canPrevious = currentPage > 1 && !isDisabled;
  const canNext = currentPage < totalPages && !isDisabled;

  return (
    <nav
      aria-label={labels.ariaLabel || 'Pagination'}
      className={`h-pagination flex flex-wrap items-center justify-between gap-3 px-4 border-t border-border-main bg-surface ${className}`}
    >
      <p className="text-xs text-text-muted tabular-nums" role="status">
        {renderShowing()}
      </p>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{labels.pageSizeLabel || 'Rows per page'}</span>
          <Select
            value={String(pageSize)}
            onChange={(event) => onPageSizeChange && onPageSizeChange(Number(event.target.value))}
            isDisabled={isDisabled}
            ariaLabel={labels.pageSizeAriaLabel || 'Rows per page'}
            options={pageSizeOptions.map((size) => ({ value: String(size), label: String(size) }))}
            className="w-20 [&_select]:h-8"
          />
        </div>

        <div className="flex items-center gap-1">
          <IconButton
            type="button"
            size="sm"
            label={labels.previousLabel || 'Previous page'}
            icon={<ChevronLeft className="w-4 h-4" aria-hidden="true" />}
            onClick={() => canPrevious && onPageChange && onPageChange(currentPage - 1)}
            isDisabled={!canPrevious}
          />
          <span className="px-1 text-xs text-text-muted tabular-nums min-w-[4.5rem] text-center">
            {labels.pageIndicator ? labels.pageIndicator(currentPage, totalPages) : `Page ${currentPage} of ${totalPages}`}
          </span>
          <IconButton
            type="button"
            size="sm"
            label={labels.nextLabel || 'Next page'}
            icon={<ChevronRight className="w-4 h-4" aria-hidden="true" />}
            onClick={() => canNext && onPageChange && onPageChange(currentPage + 1)}
            isDisabled={!canNext}
          />
        </div>
      </div>
    </nav>
  );
};

export default Pagination;
