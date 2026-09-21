"use client";

import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Card from "react-bootstrap/Card";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Dropdown from "react-bootstrap/Dropdown";

import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import api from "@/lib/api/axios";
import { getApiErrorMessage, getFieldErrors } from "@/lib/auth/auth";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Create/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    contactEmail: "",
  });

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState({ show: false, client: null, action: null });
  const [isConfirming, setIsConfirming] = useState(false);

  const loadClients = async () => {
    try {
      setLoading(true);
      const res = await api.get("/clients");
      setClients(res.data.data);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load clients."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleShowCreate = () => {
    setEditingClient(null);
    setFormData({ name: "", contactPerson: "", contactEmail: "" });
    setShowModal(true);
  };

  const handleShowEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || "",
      contactPerson: client.contactPerson || "",
      contactEmail: client.contactEmail || "",
    });
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setFormError("");
    setFormErrors({});
    setEditingClient(null);
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
      if (editingClient) {
        await api.patch(`/clients/${editingClient.id}`, formData);
        setSuccessMessage("Client updated successfully!");
      } else {
        await api.post("/clients", formData);
        setSuccessMessage("Client created successfully!");
      }
      handleClose();
      loadClients();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setFormErrors(getFieldErrors(err));
      setFormError(getApiErrorMessage(err, `Failed to ${editingClient ? "update" : "create"} client.`));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openConfirmDialog = (client) => {
    const action = client.isActive ? "deactivate" : "reactivate";
    setConfirmDialog({ show: true, client, action });
  };

  const handleConfirmAction = async () => {
    const { client, action } = confirmDialog;
    setIsConfirming(true);
    try {
      await api.patch(`/clients/${client.id}/${action}`);
      loadClients();
      setSuccessMessage(`Client ${action}d successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(getApiErrorMessage(err, `Failed to ${action} client.`));
    } finally {
      setIsConfirming(false);
      setConfirmDialog({ show: false, client: null, action: null });
    }
  };

  return (
    <AppLayout role="manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bolder mb-1 text-dark tracking-tight">Clients</h3>
          <p className="text-secondary small mb-0">Manage your agency's client accounts.</p>
        </div>
        <Button variant="primary" onClick={handleShowCreate} className="px-4 fw-medium shadow-sm rounded-pill d-flex align-items-center">
          <i className="bi bi-plus-lg me-2"></i> Add Client
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
                  <th className="px-4 py-3 fw-semibold border-bottom-0">Client Name</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0">Contact Person</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0">Contact Email</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0">Status</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <tr key={client.id}>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 text-primary rounded d-flex align-items-center justify-content-center me-3 fw-bold" style={{ width: '40px', height: '40px' }}>
                            {client.name?.[0]}
                          </div>
                          <span className="fw-bold text-dark">{client.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 fw-medium text-secondary">{client.contactPerson}</td>
                      <td className="px-4 py-3 text-secondary">{client.contactEmail}</td>
                      <td className="px-4 py-3">
                        {client.isActive ? (
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
                          <Dropdown.Menu className="border-0 shadow-sm rounded-3">
                            <Dropdown.Item onClick={() => handleShowEdit(client)} className="fw-medium text-dark py-2">
                              <i className="bi bi-pencil me-2 text-secondary"></i> Edit Client
                            </Dropdown.Item>
                            <Dropdown.Item as={Link} href={`/manager/clients/${client.id}`} className="fw-medium text-dark py-2">
                              <i className="bi bi-people me-2 text-primary"></i> Manage Users
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item 
                              onClick={() => openConfirmDialog(client)} 
                              className={`fw-medium py-2 ${client.isActive ? 'text-danger' : 'text-success'}`}
                            >
                              {client.isActive ? <><i className="bi bi-pause-circle me-2"></i> Deactivate</> : <><i className="bi bi-play-circle me-2"></i> Reactivate</>}
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-5">
                      <i className="bi bi-building fs-1 d-block mb-3 opacity-25"></i>
                      No clients found. Click "Add Client" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleClose}>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editingClient ? "Edit Client" : "Add New Client"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formError && <AlertMessage message={formError} />}
            <Form.Group className="mb-3">
              <Form.Label>Company Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Acme Corp"
                isInvalid={Boolean(formErrors.name)}
              />
              <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contact Person</Form.Label>
              <Form.Control
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="e.g. Mark"
                isInvalid={Boolean(formErrors.contactPerson)}
              />
              <Form.Control.Feedback type="invalid">{formErrors.contactPerson}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contact Email</Form.Label>
              <Form.Control
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="mark@acme.com"
                isInvalid={Boolean(formErrors.contactEmail)}
              />
              <Form.Control.Feedback type="invalid">{formErrors.contactEmail}</Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Client"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {confirmDialog.client && (
        <ConfirmDialog
          show={confirmDialog.show}
          title={`Confirm ${confirmDialog.action === 'deactivate' ? 'Deactivation' : 'Reactivation'}`}
          message={`Are you sure you want to ${confirmDialog.action} ${confirmDialog.client.name}? ${confirmDialog.action === 'deactivate' ? 'This will freeze new work for this client.' : ''}`}
          confirmText={confirmDialog.action === 'deactivate' ? 'Deactivate' : 'Reactivate'}
          cancelText="Cancel"
          variant={confirmDialog.action === 'deactivate' ? 'danger' : 'success'}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmDialog({ show: false, client: null, action: null })}
          isProcessing={isConfirming}
        />
      )}
    </AppLayout>
  );
}
