"use client";

import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Card from "react-bootstrap/Card";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Link from "next/link";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

export default function SequencesPage() {
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [clients, setClients] = useState([]);
  const [leadLists, setLeadLists] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    leadListId: "",
    name: "",
    description: "",
    pricingModel: "cost_per_lead",
    ratePerLead: "",
    retainerAmount: "",
  });

  const loadSequences = async (clientFilter = "") => {
    try {
      setLoading(true);
      const url = clientFilter ? `/sequences?clientId=${clientFilter}` : "/sequences";
      const res = await api.get(url);
      setSequences(res.data.data);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load sequences."));
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const res = await api.get("/clients");
      setClients(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadClients();
    loadSequences();
  }, []);

  // When a new client is selected in the modal, load their lead lists
  useEffect(() => {
    if (!formData.clientId) {
      setLeadLists([]);
      return;
    }
    const fetchLeadLists = async () => {
      try {
        const res = await api.get(`/lead-lists?clientId=${formData.clientId}`);
        setLeadLists(res.data.data);
      } catch (err) {
        setLeadLists([]);
      }
    };
    fetchLeadLists();
  }, [formData.clientId]);

  // When dashboard dropdown changes
  const handleClientFilterChange = (e) => {
    const val = e.target.value;
    setSelectedClientId(val);
    loadSequences(val);
  };

  const handleShow = () => {
    setFormData({
      clientId: selectedClientId || (clients.length > 0 ? clients[0].id : ""),
      leadListId: "",
      name: "",
      description: "",
      pricingModel: "cost_per_lead",
      ratePerLead: "",
      retainerAmount: "",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleClose = () => setShowModal(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    
    // Clean up payload based on pricing model
    const payload = { ...formData };
    if (payload.pricingModel === "cost_per_lead") {
      payload.retainerAmount = null;
      payload.ratePerLead = parseFloat(payload.ratePerLead);
    } else if (payload.pricingModel === "flat_retainer") {
      payload.ratePerLead = null;
      payload.retainerAmount = parseFloat(payload.retainerAmount);
    } else {
      payload.ratePerLead = null;
      payload.retainerAmount = null;
    }

    try {
      await api.post("/sequences", payload);
      handleClose();
      loadSequences(selectedClientId);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Failed to create sequence."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout role="manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bolder mb-1 text-dark tracking-tight">Sequences</h3>
          <p className="text-secondary small mb-0">Build and manage multi-step outreach motions.</p>
        </div>
        <Button variant="primary" onClick={handleShow} className="px-4 fw-medium shadow-sm rounded-pill d-flex align-items-center">
          <i className="bi bi-plus-lg me-2"></i> Create Sequence
        </Button>
      </div>

      {error && <AlertMessage message={error} />}

      <Card className="border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Card.Header className="bg-white border-bottom py-3">
          <Form.Group className="mb-0 d-flex align-items-center">
            <i className="bi bi-filter text-primary me-2 fs-5"></i>
            <Form.Label className="fw-semibold mb-0 me-3 text-nowrap text-dark">Filter by Client:</Form.Label>
            <Form.Select 
              value={selectedClientId} 
              onChange={handleClientFilterChange}
              className="bg-light border-0 shadow-none fw-medium"
              style={{ maxWidth: "300px", borderRadius: '8px' }}
            >
              <option value="">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="p-5 d-flex justify-content-center">
              <LoadingSpinner />
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light text-muted">
                <tr>
                  <th className="px-4 py-3 fw-semibold border-bottom-0">Sequence Name</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0">Client</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0">Target List</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0 text-center">Steps</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0">Pricing Model</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sequences.length > 0 ? (
                  sequences.map((seq) => (
                    <tr key={seq.id}>
                      <td className="px-4 py-3 fw-bold">
                        <Link href={`/manager/sequences/${seq.id}`} className="text-decoration-none text-dark d-flex align-items-center">
                          <i className="bi bi-diagram-3 text-primary me-2"></i> {seq.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 fw-medium text-secondary">{seq.client?.name || "Unknown"}</td>
                      <td className="px-4 py-3 text-secondary">{seq.leadList?.name || "Unknown"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-bold">
                          {seq.stepCount || 0} Steps
                        </span>
                      </td>
                      <td className="px-4 py-3 fw-medium">
                        {seq.pricingModel === 'cost_per_lead' && <span className="text-success"><i className="bi bi-tag-fill me-1"></i> CPL (${seq.ratePerLead})</span>}
                        {seq.pricingModel === 'flat_retainer' && <span className="text-success"><i className="bi bi-cash-stack me-1"></i> Retainer (${seq.flatRetainer})</span>}
                        {seq.pricingModel === 'unpriced' && <span className="text-muted"><i className="bi bi-slash-circle me-1"></i> Unpriced</span>}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Link href={`/manager/sequences/${seq.id}`} className="btn btn-light text-primary fw-bold btn-sm rounded-pill px-3 shadow-sm">
                          Manage <i className="bi bi-arrow-right ms-1"></i>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-5">
                      <i className="bi bi-diagram-3 fs-1 d-block mb-3 opacity-25"></i>
                      No sequences found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleClose} backdrop="static">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>Create New Sequence</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formError && <AlertMessage message={formError} />}
            
            <Form.Group className="mb-3">
              <Form.Label>Client</Form.Label>
              <Form.Select 
                name="clientId" 
                value={formData.clientId} 
                onChange={handleChange}
                required
              >
                <option value="">-- Select Client --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Target Lead List</Form.Label>
              <Form.Select 
                name="leadListId" 
                value={formData.leadListId} 
                onChange={handleChange}
                required
                disabled={!formData.clientId || leadLists.length === 0}
              >
                <option value="">-- Select List --</option>
                {leadLists.filter(l => l.status === 'active').map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </Form.Select>
              {formData.clientId && leadLists.length === 0 && (
                <Form.Text className="text-danger">This client has no active lead lists.</Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Sequence Name</Form.Label>
              <Form.Control 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange}
                placeholder="e.g. Q3 Executive Outreach"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2}
                name="description" 
                value={formData.description} 
                onChange={handleChange}
                placeholder="Internal notes about this motion"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Pricing Model</Form.Label>
              <Form.Select 
                name="pricingModel" 
                value={formData.pricingModel} 
                onChange={handleChange}
                required
              >
                <option value="cost_per_lead">Cost Per Lead (CPL)</option>
                <option value="flat_retainer">Flat Retainer</option>
                <option value="unpriced">Unpriced (Internal)</option>
              </Form.Select>
            </Form.Group>

            {formData.pricingModel === "cost_per_lead" && (
              <Form.Group className="mb-3">
                <Form.Label>Rate Per Lead ($)</Form.Label>
                <Form.Control 
                  type="number" 
                  step="0.01"
                  min="0"
                  name="ratePerLead" 
                  value={formData.ratePerLead} 
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            )}

            {formData.pricingModel === "flat_retainer" && (
              <Form.Group className="mb-3">
                <Form.Label>Retainer Amount ($)</Form.Label>
                <Form.Control 
                  type="number" 
                  step="0.01"
                  min="0"
                  name="retainerAmount" 
                  value={formData.retainerAmount} 
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            )}

          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create Sequence"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </AppLayout>
  );
}
