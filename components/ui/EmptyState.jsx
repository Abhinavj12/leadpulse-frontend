import React from 'react';

export function EmptyState({ title, description, action }) {
  return (
    <div className="text-center py-5 px-3 bg-light rounded border border-light-subtle">
      <div className="mb-3">
        <i className="bi bi-inbox text-secondary" style={{ fontSize: '2.5rem' }}></i>
      </div>
      <h5 className="text-dark fw-medium mb-2">{title || 'No data found'}</h5>
      {description && <p className="text-muted mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
