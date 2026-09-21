"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

import AuthShell from "@/components/auth/AuthShell";
import AlertMessage from "@/components/ui/AlertMessage";
import { forgotPassword } from "@/lib/api/auth";
import { getApiErrorMessage, getFieldErrors } from "@/lib/auth/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setFieldError("");
    setMessage("");

    if (!email.trim()) {
      setFieldError("Email is required.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await forgotPassword({ email: email.trim().toLowerCase() });
      setMessage(data?.message || "If the account exists, a password reset link has been sent.");
    } catch (requestError) {
      const fields = getFieldErrors(requestError);
      setFieldError(fields.email || "");
      setError(getApiErrorMessage(requestError, "Unable to process the request."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your account email and we will send reset instructions."
      footer={
        <span className="small">
          <Link href="/login">Back to sign in</Link>
        </span>
      }
    >
      {message ? (
        <AlertMessage message={message} variant="success" />
      ) : (
        <>
          <AlertMessage message={error} />
          <Form onSubmit={handleSubmit} noValidate>
            <Form.Group className="mb-4" controlId="forgotEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldError("");
                  setError("");
                }}
                autoComplete="email"
                isInvalid={Boolean(fieldError)}
                placeholder="you@company.com"
              />
              <Form.Control.Feedback type="invalid">{fieldError}</Form.Control.Feedback>
            </Form.Group>

            <Button type="submit" className="w-100" disabled={submitting}>
              {submitting ? "Sending..." : "Send reset link"}
            </Button>
          </Form>
        </>
      )}
    </AuthShell>
  );
}
