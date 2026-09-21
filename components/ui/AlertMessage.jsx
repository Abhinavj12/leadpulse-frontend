"use client";

import Alert from "react-bootstrap/Alert";

export default function AlertMessage({ message, variant = "danger", onClose }) {
  if (!message) return null;

  return (
    <Alert variant={variant} dismissible={Boolean(onClose)} onClose={onClose}>
      {message}
    </Alert>
  );
}
