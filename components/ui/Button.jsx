import React from 'react';
import { Button as BsButton } from 'react-bootstrap';

export function Button({ variant = 'primary', className = '', isLoading = false, children, ...props }) {
  // Translate our flat UI palette (e.g. 'primary' could map to a specific bootstrap theme, or just rely on CSS overrides)
  return (
    <BsButton 
      variant={variant} 
      className={`shadow-sm ${className}`} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Loading...
        </>
      ) : (
        children
      )}
    </BsButton>
  );
}
