"use client";

import { useState } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import AlertMessage from "@/components/ui/AlertMessage";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api/axios";
import { getApiErrorMessage, getFieldErrors } from "@/lib/auth/auth";

export default function ManagerProfilePage() {
  const { user, refreshSession, logout } = useAuth();
  
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || ""
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileMessage, setProfileMessage] = useState("");
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

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
    setProfileSubmitting(true);
    
    try {
      await api.patch("/auth/profile", profileForm);
      await refreshSession();
      setProfileMessage("Profile updated successfully.");
      setTimeout(() => setProfileMessage(""), 3000);
    } catch (error) {
      setProfileErrors(getFieldErrors(error));
      setProfileMessage(getApiErrorMessage(error, "Failed to update profile."));
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordErrors({});
    setPasswordMessage("");
    
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordErrors({ confirmNewPassword: "Passwords do not match." });
      return;
    }
    
    setPasswordSubmitting(true);
    try {
      await api.patch("/auth/change-password", passwordForm);
      // As per spec: Invalidates every session including the current one — sign the user out afterward.
      await logout();
      window.location.href = "/login";
    } catch (error) {
      setPasswordErrors(getFieldErrors(error));
      setPasswordMessage(getApiErrorMessage(error, "Failed to change password."));
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <AppLayout role="manager">
      <PageHeader title="Profile" subtitle="Manage your personal information and security." />

      <Row className="g-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-0 pt-4 pb-0">
              <h5 className="fw-bold mb-0">Personal Information</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {profileMessage && (
                <AlertMessage 
                  variant={profileMessage.includes("success") ? "success" : "danger"} 
                  message={profileMessage} 
                />
              )}
              <Form onSubmit={handleProfileSubmit}>
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
                
                <Form.Group className="mb-4">
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
                
                <Form.Group className="mb-4">
                  <Form.Label className="fw-medium text-dark">Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    value={user?.email || ""}
                    disabled
                  />
                  <Form.Text className="text-muted">Email cannot be changed.</Form.Text>
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
              {passwordMessage && (
                <AlertMessage 
                  variant={passwordMessage.includes("success") ? "success" : "danger"} 
                  message={passwordMessage} 
                />
              )}
              <Form onSubmit={handlePasswordSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium text-dark">Current Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    isInvalid={Boolean(passwordErrors.currentPassword)}
                  />
                  <Form.Control.Feedback type="invalid">{passwordErrors.currentPassword}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium text-dark">New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    isInvalid={Boolean(passwordErrors.newPassword)}
                  />
                  <Form.Control.Feedback type="invalid">{passwordErrors.newPassword}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-medium text-dark">Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmNewPassword"
                    value={passwordForm.confirmNewPassword}
                    onChange={handlePasswordChange}
                    isInvalid={Boolean(passwordErrors.confirmNewPassword)}
                  />
                  <Form.Control.Feedback type="invalid">{passwordErrors.confirmNewPassword}</Form.Control.Feedback>
                </Form.Group>

                <Button type="submit" variant="primary" className="fw-medium rounded-pill px-4" disabled={passwordSubmitting}>
                  {passwordSubmitting ? "Updating..." : "Update Password"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </AppLayout>
  );
}
