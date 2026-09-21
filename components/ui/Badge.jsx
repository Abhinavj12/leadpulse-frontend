import React from 'react';

export function Badge({ variant = 'secondary', className = '', children, ...props }) {
  return (
    <span 
      className={`badge bg-${variant} bg-opacity-10 text-${variant} rounded-pill fw-medium px-3 py-2 ${className}`} 
      {...props}
    >
      {children}
    </span>
  );
}
