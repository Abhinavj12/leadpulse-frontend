import React from 'react';
import { Card as BsCard } from 'react-bootstrap';

export function Card({ className = '', children, ...props }) {
  return (
    <BsCard className={`border-0 shadow-sm mb-4 ${className}`} {...props}>
      {children}
    </BsCard>
  );
}

Card.Header = ({ className = '', children, ...props }) => (
  <BsCard.Header className={`bg-white border-bottom py-3 ${className}`} {...props}>
    {children}
  </BsCard.Header>
);

Card.Body = BsCard.Body;
Card.Footer = ({ className = '', children, ...props }) => (
  <BsCard.Footer className={`bg-white border-top py-3 ${className}`} {...props}>
    {children}
  </BsCard.Footer>
);
Card.Title = ({ className = '', children, ...props }) => (
  <BsCard.Title className={`mb-0 fw-semibold text-dark ${className}`} {...props}>
    {children}
  </BsCard.Title>
);
