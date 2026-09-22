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
import AlertMessage from "@/components/ui/AlertMessage";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api/axios";
import { getApiErrorMessage, getFieldErrors } from "@/lib/auth/auth";

export default function ClientProfilePage() {
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
      setProfileMessage("Profile details updated successfully.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setProfileMessage(""), 3000);
    } catch (error) {
      setProfileErrors(getFieldErrors(error));
      setProfileMessage(getApiErrorMessage(error, "Failed to update profile."));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordErrors({});
    setPasswordMessage("");
    
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordErrors({ confirmNewPassword: "New passwords do not match." });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    setPasswordSubmitting(true);
    try {
      await api.patch("/auth/change-password", passwordForm);
      setProfileMessage("Password changed successfully. Signing out all sessions...");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(async () => {
        await logout();
        window.location.href = "/login";
      }, 1500);
    } catch (error) {
      setPasswordErrors(getFieldErrors(error));
      setPasswordMessage(getApiErrorMessage(error, "Failed to change password."));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <AppLayout role="client">
      <PageHeader title="Profile & Account Security" subtitle="Manage your contact information and security settings." />

      {/* ACCOUNT SUMMARY CARD */}
      <Card className="border-0 shadow-sm rounded-3 mb-4">
        <Card.Body className="p-4 d-flex align-items-center gap-3">
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fs-3 fw-bold" style={{ width: '56px', height: '56px' }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="fw-bold text-dark m-0">{user?.firstName} {user?.lastName}</h4>
              <Badge bg="info" className="text-dark text-uppercase px-2 py-1">Client Portal User</Badge>
            </div>
            <div className="text-muted small mt-1">
              <i className="bi bi-envelope me-1"></i> {user?.email}
            </div>
          </div>
        </Card.Body>
      </Card>

      <Row className="g-4">
        {/* PERSONAL INFORMATION FORM */}
        <Col md={6}>
          <Card className="border-0 shadow-sm rounded-3 h-100">
            <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
              <h5 className="fw-bold mb-0">Personal Details</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {profileMessage && (
                <AlertMessage 
                  variant={profileMessage.includes("successfully") ? "success" : "danger"} 
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
                  <Form.Text className="text-muted">Registered account email address (read-only).</Form.Text>
                </Form.Group>

                <Button type="submit" variant="primary" className="fw-medium rounded-pill px-4" disabled={profileSubmitting}>
                  {profileSubmitting ? "Saving Changes..." : "Save Profile Details"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* CHANGE PASSWORD FORM */}
        <Col md={6}>
          <Card className="border-0 shadow-sm rounded-3 h-100">
            <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
              <h5 className="fw-bold mb-0">Change Security Password</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {passwordMessage && (
                <AlertMessage 
                  variant={passwordMessage.includes("successfully") ? "success" : "danger"} 
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
                    placeholder="Enter current password"
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
                    placeholder="Enter new password"
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
                    placeholder="Confirm new password"
                  />
                  <Form.Control.Feedback type="invalid">{passwordErrors.confirmNewPassword}</Form.Control.Feedback>
                </Form.Group>

                <Button type="submit" variant="primary" className="fw-medium rounded-pill px-4" disabled={passwordSubmitting}>
                  {passwordSubmitting ? "Updating Password..." : "Update Password"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </AppLayout>
  );
}
