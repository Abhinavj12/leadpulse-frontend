"use client";

import { useState } from "react";
import Form from "react-bootstrap/Form";

export default function PasswordField({
  label = "Password",
  name,
  value,
  onChange,
  error,
  placeholder = "Enter password",
  autoComplete = "current-password",
  required = true
}) {
  const [visible, setVisible] = useState(false);

  return (
    <Form.Group className="mb-3" controlId={name}>
      <Form.Label>{label}</Form.Label>
      <div className="password-input-wrap">
        <Form.Control
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          isInvalid={Boolean(error)}
          required={required}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <i className={`bi ${visible ? "bi-eye-slash" : "bi-eye"}`} />
        </button>
        {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
      </div>
    </Form.Group>
  );
}
