import React from 'react';
import { Table as BsTable } from 'react-bootstrap';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';
import { AlertMessage } from './AlertMessage';

export function Table({ 
  columns, 
  data, 
  keyField = 'id',
  loading = false, 
  error = null, 
  emptyTitle = 'No data found', 
  emptyDescription, 
  className = '',
  hover = true,
  responsive = true,
  onRetry
}) {
  if (loading && (!data || data.length === 0)) {
    return <div className="py-5 text-center"><LoadingSpinner /></div>;
  }

  if (error && (!data || data.length === 0)) {
    return (
      <div className="py-3">
        <AlertMessage variant="danger" message={error} />
        {onRetry && (
          <div className="text-center mt-3">
            <button className="btn btn-outline-danger btn-sm" onClick={onRetry}>Try Again</button>
          </div>
        )}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <BsTable responsive={responsive} hover={hover} className={`mb-0 align-middle ${className}`}>
      <thead className="table-light text-secondary">
        <tr>
          {columns.map((col, index) => (
            <th key={index} className="fw-medium border-bottom-0 py-3" style={col.style}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="border-top-0">
        {data.map((row, rowIndex) => (
          <tr key={row[keyField] || rowIndex}>
            {columns.map((col, colIndex) => (
              <td key={colIndex} className="py-3 text-dark border-bottom border-light-subtle">
                {col.render ? col.render(row, rowIndex) : row[col.accessor]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </BsTable>
  );
}
