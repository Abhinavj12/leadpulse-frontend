"use client";

import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className="auth-page">
      <Container className="py-5">
        <div className="auth-shell">
          <div className="text-center mb-4">
            <div className="auth-brand fs-3">LeadPulse</div>
            <div className="text-secondary small mt-1">
              Lead generation and outreach management
            </div>
          </div>

          <Card className="auth-card border-0">
            <Card.Body className="p-4 p-md-5">
              <h1 className="h4 mb-2">{title}</h1>
              {subtitle && <p className="text-secondary mb-4">{subtitle}</p>}
              {children}
            </Card.Body>
          </Card>

          {footer && <div className="text-center mt-4">{footer}</div>}
        </div>
      </Container>
    </main>
  );
}
