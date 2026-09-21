import React from 'react';
import { Form } from 'react-bootstrap';

export const Input = React.forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <Form.Group className={`mb-3 ${className}`}>
      {label && <Form.Label className="fw-medium text-dark">{label}</Form.Label>}
      <Form.Control 
        ref={ref}
        className={`shadow-none ${error ? 'is-invalid' : ''}`} 
        {...props} 
      />
      {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
    </Form.Group>
  );
});

Input.displayName = 'Input';
