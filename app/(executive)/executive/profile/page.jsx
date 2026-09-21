"use client";

import { useState } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Badge from "react-bootstrap/Badge";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import PasswordField from "@/components/auth/PasswordField";
import AlertMessage from "@/components/ui/AlertMessage";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api/axios";
import { getApiErrorMessage, getFieldErrors } from "@/lib/auth/auth";

// Mirrors the backend password policy (Section 3.1): min 8 chars, at least
// one uppercase letter, one digit, and one special character.
function validatePassword(password) {
  if (password.length < 8) return "Password must be at least 8 characters long.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one digit.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character.";
  return "";
}

export default function ExecutiveProfilePage() {
  const { user, refreshSession, logout } = useAuth();

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || ""
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileMessage, setProfileMessage] = useState("");
  const [profileVariant, setProfileVariant] = useState("danger");
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordVariant, setPasswordVariant] = useState("danger");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    setProfileErrors({ ...profileErrors, [e.target.name]: "" });
    setProfileMessage("");
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setPasswordErrors({ ...passwordErrors, [e.target.name]: "" });
    setPasswordMessage("");
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileErrors({});
    setProfileMessage("");

    const firstName = profileForm.firstName.trim();
    const lastName = profileForm.lastName.trim();
    if (!firstName || !lastName) {
      setProfileErrors({
        ...(firstName ? {} : { firstName: "First name is required." }),
        ...(lastName ? {} : { lastName: "Last name is required." })
      });
      return;
    }

    setProfileSubmitting(true);
    try {
      await api.patch("/auth/profile", { firstName, lastName });
      await refreshSession();
      setProfileVariant("success");
      setProfileMessage("Profile updated successfully.");
      setTimeout(() => setProfileMessage(""), 3000);
    } catch (error) {
      setProfileErrors(getFieldErrors(error));
      setProfileVariant("danger");
      setProfileMessage(getApiErrorMessage(error, "Failed to update profile."));
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordErrors({});
    setPasswordMessage("");

    const fieldErrors = {};
    if (!passwordForm.currentPassword) {
      fieldErrors.currentPassword = "Current password is required.";
    }
    const policyError = validatePassword(passwordForm.newPassword);
    if (policyError) {
      fieldErrors.newPassword = policyError;
    }
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      fieldErrors.confirmNewPassword = "Passwords do not match.";
    }
    if (Object.keys(fieldErrors).length > 0) {
      setPasswordErrors(fieldErrors);
      return;
    }

    setPasswordSubmitting(true);
    try {
      await api.patch("/auth/change-password", passwordForm);
      // Per spec: this invalidates every session including the current one,
      // so the executive must be signed out immediately afterward.
      setPasswordVariant("success");
      setPasswordMessage("Password changed. Signing you out for security...");
      setSigningOut(true);
      setTimeout(async () => {
        await logout();
        window.location.href = "/login";
      }, 1500);
    } catch (error) {
      setPasswordErrors(getFieldErrors(error));
      setPasswordVariant("danger");
      setPasswordMessage(getApiErrorMessage(error, "Failed to change password."));
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <AppLayout role="executive">
      <PageHeader title="Profile" subtitle="Manage your personal information and security." />

      <Row className="g-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-0 pt-4 pb-0">
              <h5 className="fw-bold mb-0">Personal Information</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {profileMessage && <AlertMessage variant={profileVariant} message={profileMessage} />}
              <Form onSubmit={handleProfileSubmit} noValidate>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium text-dark">First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={profileForm.firstName}
                    onChange={handleProfileChange}
                    isInvalid={Boolean(profileErrors.firstName)}
                  />
                  <Form.Control.Feedback type="invalid">{profileErrors.firstName}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium text-dark">Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={profileForm.lastName}
                    onChange={handleProfileChange}
                    isInvalid={Boolean(profileErrors.lastName)}
                  />
                  <Form.Control.Feedback type="invalid">{profileErrors.lastName}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium text-dark">Email Address</Form.Label>
                  <Form.Control type="email" value={user?.email || ""} disabled />
                  <Form.Text className="text-muted">Email cannot be changed.</Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-medium text-dark d-block">Role</Form.Label>
                  <Badge bg="primary" className="px-3 py-2 rounded-pill text-uppercase">Executive</Badge>
                </Form.Group>

                <Button type="submit" variant="primary" className="fw-medium rounded-pill px-4" disabled={profileSubmitting}>
                  {profileSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-0 pt-4 pb-0">
              <h5 className="fw-bold mb-0">Change Password</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {passwordMessage && <AlertMessage variant={passwordVariant} message={passwordMessage} />}
              <Form onSubmit={handlePasswordSubmit} noValidate>
                <PasswordField
                  label="Current Password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  error={passwordErrors.currentPassword}
                  autoComplete="current-password"
                  placeholder="Enter your current password"
                />

                <PasswordField
                  label="New Password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  error={passwordErrors.newPassword}
                  autoComplete="new-password"
                  placeholder="Enter a new password"
                />
                <Form.Text className="text-muted d-block mb-3" style={{ marginTop: "-0.75rem" }}>
                  At least 8 characters, with an uppercase letter, a digit, and a special character.
                </Form.Text>

                <PasswordField
                  label="Confirm New Password"
                  name="confirmNewPassword"
                  value={passwordForm.confirmNewPassword}
                  onChange={handlePasswordChange}
                  error={passwordErrors.confirmNewPassword}
                  autoComplete="new-password"
                  placeholder="Re-enter the new password"
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="fw-medium rounded-pill px-4 mt-1"
                  disabled={passwordSubmitting || signingOut}
                >
                  {passwordSubmitting ? "Updating..." : signingOut ? "Signing out..." : "Update Password"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </AppLayout>
  );
}
