import React from 'react';
import { Download } from 'lucide-react';

import { Button } from './Button';
import { downloadCsv } from '../../utils/downloadCsv';

/**
 * Generic table export control: downloads `columns`/`data` as a CSV file.
 * Columns follow the Table contract ({ key, header, render }).
 *
 * Props: filename, columns, data, label (default "Export CSV"), variant.
 */
export const DownloadCsvButton = ({
  filename,
  columns = [],
  data = [],
  label = 'Export CSV',
  variant = 'outline',
  size = 'md',
  className = '',
}) => {
  const handleExport = () => {
    const headers = columns.map((column) => column.header);
    const rows = data.map((row) =>
      columns.map((column) => (column.render ? column.render(row) : row[column.key])),
    );
    downloadCsv(filename, headers, rows);
  };

  return (
    <Button variant={variant} size={size} onClick={handleExport} className={className}>
      <Download className="w-5 h-5" aria-hidden="true" />
      {label}
    </Button>
  );
};

export default DownloadCsvButton;
