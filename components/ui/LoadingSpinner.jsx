"use client";

import Spinner from "react-bootstrap/Spinner";

export default function LoadingSpinner({ fullPage = false, label = "Loading..." }) {
  const content = (
    <div className="d-flex align-items-center justify-content-center gap-2 py-4">
      <Spinner animation="border" size="sm" role="status" aria-hidden="true" />
      <span className="text-secondary">{label}</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        {content}
      </div>
    );
  }

  return content;
}
