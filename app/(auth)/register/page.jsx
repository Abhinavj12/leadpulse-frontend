"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";

import AuthShell from "@/components/auth/AuthShell";
import PasswordField from "@/components/auth/PasswordField";
import AlertMessage from "@/components/ui/AlertMessage";
import { useAuth } from "@/hooks/useAuth";
import { register } from "@/lib/api/auth";
import { getApiErrorMessage, getFieldErrors, redirectForRole } from "@/lib/auth/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { login, loading: authLoading, user } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      redirectForRole(router, user.role);
    }
  }, [authLoading, user, router]);

  if (authLoading || user) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setServerError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setServerError("");

    const clientErrors = {};
    if (!form.firstName.trim()) clientErrors.firstName = "First name is required.";
    if (!form.lastName.trim()) clientErrors.lastName = "Last name is required.";
    if (!form.email.trim()) clientErrors.email = "Email is required.";
    if (form.password.length < 8) clientErrors.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) {
      clientErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirmPassword
      });

      const loggedInUser = await login({
        email: form.email.trim().toLowerCase(),
        password: form.password
      });

      redirectForRole(router, loggedInUser.role);
    } catch (error) {
      setErrors(getFieldErrors(error));
      setServerError(getApiErrorMessage(error, "Unable to create the account."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Campaign Manager registration."
      footer={
        <span className="small text-secondary">
          Already registered? <Link href="/login">Sign in</Link>
        </span>
      }
    >
      <AlertMessage message={serverError} />

      <Form onSubmit={handleSubmit} noValidate>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="firstName">
              <Form.Label>First name</Form.Label>
              <Form.Control
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                autoComplete="given-name"
                isInvalid={Boolean(errors.firstName)}
              />
              <Form.Control.Feedback type="invalid">{errors.firstName}</Form.Control.Feedback>
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group className="mb-3" controlId="lastName">
              <Form.Label>Last name</Form.Label>
              <Form.Control
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                autoComplete="family-name"
                isInvalid={Boolean(errors.lastName)}
              />
              <Form.Control.Feedback type="invalid">{errors.lastName}</Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3" controlId="registerEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            isInvalid={Boolean(errors.email)}
          />
          <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
        </Form.Group>

        <PasswordField
          label="Password"
          name="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="new-password"
        />

        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <p className="small text-secondary mb-4">
          Use at least 8 characters, including an uppercase letter, a number, and a special character.
        </p>

        <Button type="submit" className="w-100" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </Button>
      </Form>
    </AuthShell>
  );
}
