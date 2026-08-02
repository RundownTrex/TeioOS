import React, { useId } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Checkbox } from './Checkbox';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';

/**
 * Presentational data table core (no pagination/filtering logic).
 * Props: columns ([{ key, header, align, sortable, width, render, className }]),
 *        data, rowKey (string | fn), loading, error, empty,
 *        selectable, selectedKeys (Set), onSelectChange,
 *        sort ({ key, direction }), onSortChange, caption, className.
 */
export const Table = ({
  columns = [],
  data = [],
  rowKey,
  loading = false,
  error,
  empty,
  selectable = false,
  selectedKeys = new Set(),
  onSelectChange,
  sort,
  onSortChange,
  caption,
  className = '',
}) => {
  const tableId = useId();
  const hasSelection = selectable && typeof onSelectChange === 'function';

  const getRowKey = (row, index) => {
    if (typeof rowKey === 'function') return rowKey(row);
    if (rowKey) return row[rowKey];
    return index;
  };

  const allRowsSelected =
    data.length > 0 && data.every((row, index) => selectedKeys.has(getRowKey(row, index)));
  const someRowsSelected =
    !allRowsSelected && data.some((row, index) => selectedKeys.has(getRowKey(row, index)));

  const toggleAll = () => {
    const allKeys = data.map((row, index) => getRowKey(row, index));
    const nextKeys = new Set(selectedKeys);
    if (allRowsSelected) {
      allKeys.forEach((key) => nextKeys.delete(key));
    } else {
      allKeys.forEach((key) => nextKeys.add(key));
    }
    onSelectChange(nextKeys, null);
  };

  const toggleRow = (key, row) => {
    const nextKeys = new Set(selectedKeys);
    if (nextKeys.has(key)) nextKeys.delete(key);
    else nextKeys.add(key);
    onSelectChange(nextKeys, row);
  };

  const toggleSort = (column) => {
    if (!onSortChange) return;
    const isActive = sort?.key === column.key;
    const nextDirection = !isActive ? 'asc' : sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange(column.key, nextDirection);
  };

  const alignClass = (align) =>
    align === 'right'
      ? 'text-right tabular-nums'
      : align === 'center'
        ? 'text-center'
        : 'text-left';

  return (
    <div
      tabIndex={0}
      aria-label="Scroll table horizontally"
      className={`overflow-x-auto rounded-lg ${className}`}
    >
      <table className="w-full border-collapse text-sm" aria-describedby={caption ? `caption-${tableId}` : undefined}>
        {caption && (
          <caption id={`caption-${tableId}`} className="sr-only">
            {caption}
          </caption>
        )}

        <thead>
          <tr className="bg-subtle border-b border-border-strong">
            {hasSelection && (
              <th scope="col" className="w-12 px-4 py-2 text-left">
                <Checkbox
                  checked={allRowsSelected}
                  indeterminate={someRowsSelected}
                  onChange={toggleAll}
                  label="Select all rows"
                  className="[&_input]:mt-0"
                />
              </th>
            )}

            {columns.map((column) => {
              const isSorted = sort?.key === column.key;
              const ariaSort = isSorted
                ? sort.direction === 'asc' ? 'ascending' : 'descending'
                : column.sortable ? 'none' : undefined;

              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={ariaSort}
                  style={column.width ? { width: column.width } : undefined}
                  className={`h-table-header px-4 text-xs font-semibold uppercase tracking-wide text-text-muted ${alignClass(column.align)} ${column.className || ''}`}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column)}
                      className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide hover:text-text-main transition-colors ${
                        isSorted ? 'text-navy-primary' : 'text-text-muted'
                      } ${column.align === 'right' ? 'flex-row-reverse' : ''}`}
                    >
                      {column.header}
                      {isSorted ? (
                        sort.direction === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-50" aria-hidden="true" />
                      )}
                      <span className="sr-only">
                        {isSorted
                          ? `, sorted ${sort.direction === 'asc' ? 'ascending' : 'descending'}`
                          : ', not sorted'}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <tr key={`skeleton-${index}`} className="border-b border-border-main">
                {hasSelection && (
                  <td className="px-4 py-2 w-12">
                    <LoadingSkeleton variant="rectangular" height="1.25rem" />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-2">
                    <LoadingSkeleton variant="text" width="6rem" />
                  </td>
                ))}
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={columns.length + (hasSelection ? 1 : 0)} className="px-4 py-6">
                {error}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (hasSelection ? 1 : 0)} className="px-4 py-6">
                {empty || (
                  <EmptyState
                    title="No records found"
                    description="No items match the current view. Adjust the filters or add new records."
                  />
                )}
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const key = getRowKey(row, index);
              return (
                <tr
                  key={key}
                  className={`border-b border-border-main transition-colors ${
                    hasSelection && selectedKeys.has(key) ? 'bg-subtle' : 'hover:bg-subtle'
                  }`}
                >
                  {hasSelection && (
                    <td className="px-4 py-2 w-12">
                      <Checkbox
                        checked={selectedKeys.has(key)}
                        onChange={() => toggleRow(key, row)}
                        label={`Select row ${index + 1}`}
                        className="[&_input]:mt-0"
                      />
                    </td>
                  )}

                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-2.5 ${alignClass(column.align)} ${column.className || ''}`}
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
