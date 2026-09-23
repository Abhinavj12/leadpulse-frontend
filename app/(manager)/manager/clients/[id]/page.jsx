"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Card from "react-bootstrap/Card";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Dropdown from "react-bootstrap/Dropdown";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PaginationControl } from "@/components/ui/PaginationControl";
import api from "@/lib/api/axios";
import { getApiErrorMessage, getFieldErrors } from "@/lib/auth/auth";

export default function ClientUsersPage({ params }) {
  const unwrappedParams = use(params);
  const clientId = unwrappedParams.id;
  
  const [client, setClient] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    temporaryPassword: ""
  });

  const [confirmDialog, setConfirmDialog] = useState({ show: false, user: null, action: null });
  const [isConfirming, setIsConfirming] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientRes, usersRes] = await Promise.all([
        api.get(`/clients/${clientId}`),
        api.get(`/users/client-users?clientId=${clientId}`)
      ]);
      setClient(clientRes.data.data);
      setUsers(usersRes.data.data);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load client details."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clientId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  const handleShow = () => {
    setFormData({ firstName: "", lastName: "", email: "", temporaryPassword: "" });
    setShowModal(true);
  };
  
  const handleClose = () => {
    setShowModal(false);
    setFormError("");
    setFormErrors({});
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormErrors({});
    setIsSubmitting(true);
    try {
      const payload = { ...formData, clientId };
      if (!payload.temporaryPassword) delete payload.temporaryPassword;
      
      await api.post("/users/client-users", payload);
      handleClose();
      loadData();
      setSuccessMessage("Client portal user created successfully! Credentials emailed.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setFormErrors(getFieldErrors(err));
      setFormError(getApiErrorMessage(err, "Failed to create portal user."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openConfirmDialog = (user, action) => {
    setConfirmDialog({ show: true, user, action });
  };

  const handleConfirmAction = async () => {
    const { user, action } = confirmDialog;
    setIsConfirming(true);
    try {
      if (action === "deactivate" || action === "reactivate") {
        await api.patch(`/users/${user.id}/${action}`);
        loadData();
        setSuccessMessage(`User ${action}d successfully!`);
      } else if (action === "reset-password") {
        await api.post(`/users/${user.id}/reset-password`);
        setSuccessMessage(`Password reset link emailed to ${user.email}.`);
      }
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(getApiErrorMessage(err, `Failed to ${action.replace("-", " ")}.`));
    } finally {
      setIsConfirming(false);
      setConfirmDialog({ show: false, user: null, action: null });
    }
  };

  const getConfirmDialogProps = () => {
    const { user, action } = confirmDialog;
    if (!user || !action) return null;

    if (action === "reset-password") {
      return {
        title: "Reset Password",
        message: `Are you sure you want to send a password reset link to ${user.firstName}?`,
        confirmText: "Send Link",
        variant: "primary"
      };
    }

    if (action === "deactivate") {
      return {
        title: "Deactivate User",
        message: `Are you sure you want to deactivate ${user.firstName}? They will be logged out immediately and lose access to the portal.`,
        confirmText: "Deactivate",
        variant: "danger"
      };
    }

    return {
      title: "Reactivate User",
      message: `Are you sure you want to reactivate ${user.firstName}?`,
      confirmText: "Reactivate",
      variant: "success"
    };
  };

  const confirmProps = getConfirmDialogProps();

  return (
    <AppLayout role="manager">
      <div className="mb-3">
        <Link href="/manager/clients" className="text-decoration-none text-secondary small fw-bold">
          <i className="bi bi-arrow-left me-1"></i> Back to Clients
        </Link>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bolder mb-1 text-dark tracking-tight">Client Portal Users</h3>
          <p className="text-secondary small mb-0">
            Manage access for <span className="fw-bold">{client?.name || "Client"}</span>.
          </p>
          {client && !client.isActive && (
            <div className="badge bg-danger bg-opacity-10 text-danger mt-2">
              <i className="bi bi-exclamation-triangle me-1"></i> Client is deactivated. Portal creation disabled.
            </div>
          )}
        </div>
        <Button 
          variant="primary" 
          onClick={handleShow} 
          disabled={client && !client.isActive}
          className="px-4 fw-medium shadow-sm rounded-pill d-flex align-items-center"
        >
          <i className="bi bi-person-plus me-2"></i> Add Portal User
        </Button>
      </div>

      {error && <AlertMessage message={error} />}
      {successMessage && <AlertMessage variant="success" message={successMessage} />}

      <Card className="border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Card.Body className="p-0">
          {loading ? (
            <div className="p-5 d-flex justify-content-center">
              <LoadingSpinner />
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light text-muted">
                <tr>
                  <th className="px-4 py-3 fw-semibold border-bottom-0">Name</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0">Email</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0">Status</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold" style={{ width: '40px', height: '40px' }}>
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <span className="fw-bold text-dark">{u.firstName} {u.lastName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-secondary">{u.email}</td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill fw-bold text-uppercase tracking-wide" style={{ fontSize: '0.7rem' }}>Active</span>
                        ) : (
                          <span className="badge bg-secondary bg-opacity-10 text-secondary px-3 py-2 rounded-pill fw-bold text-uppercase tracking-wide" style={{ fontSize: '0.7rem' }}>Inactive</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Dropdown>
                          <Dropdown.Toggle variant="light" size="sm" className="rounded-circle shadow-sm border-0 px-2 text-secondary" style={{ width: '36px', height: '36px' }}>
                            <i className="bi bi-three-dots-vertical"></i>
                          </Dropdown.Toggle>
                          <Dropdown.Menu 
                            renderOnMount 
                            popperConfig={{ strategy: 'fixed' }} 
                            className="border-0 shadow-sm rounded-3"
                          >
                            <Dropdown.Item onClick={() => openConfirmDialog(u, 'reset-password')} className="fw-medium text-dark py-2">
                              <i className="bi bi-envelope me-2 text-primary"></i> Reset Password
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item 
                              onClick={() => openConfirmDialog(u, u.isActive ? 'deactivate' : 'reactivate')} 
                              className={`fw-medium py-2 ${u.isActive ? 'text-danger' : 'text-success'}`}
                            >
                              {u.isActive ? <><i className="bi bi-pause-circle me-2"></i> Deactivate</> : <><i className="bi bi-play-circle me-2"></i> Reactivate</>}
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-5">
                      <i className="bi bi-people fs-1 d-block mb-3 opacity-25"></i>
                      No portal users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
        <PaginationControl
          currentPage={currentPage}
          totalPages={Math.max(1, Math.ceil(users.length / pageSize))}
          totalItems={users.length}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          itemName="portal users"
        />
      </Card>

      <Modal show={showModal} onHide={handleClose}>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>Add Portal User</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formError && <AlertMessage message={formError} />}
            <Row className="mb-3">
              <Form.Group as={Col}>
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  isInvalid={Boolean(formErrors.firstName)}
                />
                <Form.Control.Feedback type="invalid">{formErrors.firstName}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group as={Col}>
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  isInvalid={Boolean(formErrors.lastName)}
                />
                <Form.Control.Feedback type="invalid">{formErrors.lastName}</Form.Control.Feedback>
              </Form.Group>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                isInvalid={Boolean(formErrors.email)}
              />
              <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Temporary Password (Optional)</Form.Label>
              <Form.Control
                type="text"
                name="temporaryPassword"
                value={formData.temporaryPassword}
                onChange={handleChange}
                placeholder="Leave blank to auto-generate"
                isInvalid={Boolean(formErrors.temporaryPassword)}
              />
              <Form.Control.Feedback type="invalid">{formErrors.temporaryPassword}</Form.Control.Feedback>
              <Form.Text className="text-muted">
                Must be at least 8 chars, contain an uppercase, digit, and special char.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save User"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {confirmProps && (
        <ConfirmDialog
          show={confirmDialog.show}
          title={confirmProps.title}
          message={confirmProps.message}
          confirmText={confirmProps.confirmText}
          cancelText="Cancel"
          variant={confirmProps.variant}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmDialog({ show: false, user: null, action: null })}
          isProcessing={isConfirming}
        />
      )}
    </AppLayout>
  );
}
