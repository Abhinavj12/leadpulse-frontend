"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";

import AppLayout from "@/components/layout/AppLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import { PaginationControl } from "@/components/ui/PaginationControl";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

export default function CadencesPage() {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [cadences, setCadences] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [leadLists, setLeadLists] = useState([]);

  const [formData, setFormData] = useState({
    clientId: "",
    leadListId: "",
    name: "",
    description: "",
    pricingModel: "cost_per_lead",
    ratePerLead: "",
    retainerAmount: ""
  });

  const loadData = async (clientId = "") => {
    setLoading(true);
    try {
      const [clientsRes, cadencesRes] = await Promise.all([
        api.get("/clients"),
        api.get(`/sequences${clientId ? `?clientId=${clientId}` : ''}`)
      ]);
      setClients(clientsRes.data.data);
      setCadences(cadencesRes.data.data);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load cadences."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!formData.clientId) {
      setLeadLists([]);
      return;
    }
    const fetchLeadLists = async () => {
      try {
        const res = await api.get(`/lead-lists?clientId=${formData.clientId}`);
        setLeadLists(res.data.data.filter(l => l.status === 'active'));
      } catch (err) {
        setLeadLists([]);
      }
    };
    fetchLeadLists();
  }, [formData.clientId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClientId, pageSize]);

  const handleClientFilterChange = (e) => {
    const val = e.target.value;
    setSelectedClientId(val);
    setCurrentPage(1);
    loadData(val);
  };

  const handleShow = () => {
    setFormData({
      clientId: selectedClientId || (clients.length > 0 ? clients[0].id : ""),
      leadListId: "",
      name: "",
      description: "",
      pricingModel: "cost_per_lead",
      ratePerLead: "",
      retainerAmount: ""
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

    const payload = { ...formData };
    
    if (payload.pricingModel === "cost_per_lead") {
      delete payload.retainerAmount;
      payload.ratePerLead = parseFloat(payload.ratePerLead);
    } else if (payload.pricingModel === "flat_retainer") {
      delete payload.ratePerLead;
      payload.retainerAmount = parseFloat(payload.retainerAmount);
    } else {
      delete payload.ratePerLead;
      delete payload.retainerAmount;
      delete payload.pricingModel;
    }
    
    if (!payload.description) {
      delete payload.description;
    }

    try {
      await api.post("/sequences", payload);
      handleClose();
      loadData(selectedClientId);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Failed to create cadence."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount == null) return "—";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const paginatedList = cadences.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <AppLayout role="manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bolder mb-1 text-dark tracking-tight">Cadences</h3>
          <p className="text-secondary small mb-0">Multi-step outreach motions representing client billing units.</p>
        </div>
        <Button variant="primary" onClick={handleShow} className="px-4 fw-medium shadow-sm rounded-pill d-flex align-items-center">
          <i className="bi bi-plus-lg me-2"></i> Create Cadence
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
          ) : cadences.length > 0 ? (
            <>
              <Table hover responsive className="mb-0 align-middle">
                <thead className="bg-light text-muted">
                  <tr>
                    <th className="px-4 py-3 fw-semibold border-bottom-0">Name</th>
                    <th className="px-4 py-3 fw-semibold border-bottom-0">Client</th>
                    <th className="px-4 py-3 fw-semibold border-bottom-0 text-center">Steps</th>
                    <th className="px-4 py-3 fw-semibold border-bottom-0">Pricing Model</th>
                    <th className="px-4 py-3 fw-semibold border-bottom-0">Rate</th>
                    <th className="px-4 py-3 fw-semibold border-bottom-0 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((cadence) => (
                    <tr key={cadence.id}>
                      <td className="px-4 py-3 fw-bold">
                        <Link href={`/manager/cadences/${cadence.id}`} className="text-decoration-none text-dark hover-text-primary">
                          {cadence.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-secondary fw-medium">
                        {clients.find(c => c.id === cadence.clientId)?.name || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-bold fs-6">
                          {cadence.stepCount || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {cadence.pricingModel === 'cost_per_lead' ? (
                          <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2">Cost Per Lead</span>
                        ) : cadence.pricingModel === 'flat_retainer' ? (
                          <span className="badge bg-info bg-opacity-10 text-info rounded-pill px-3 py-2">Flat Retainer</span>
                        ) : (
                          <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3 py-2">Unpriced</span>
                        )}
                      </td>
                      <td className="px-4 py-3 fw-medium text-dark">
                        {cadence.pricingModel === 'cost_per_lead' ? formatCurrency(cadence.ratePerLead) : formatCurrency(cadence.retainerAmount)}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Link href={`/manager/cadences/${cadence.id}`} className="btn btn-light text-primary fw-bold btn-sm rounded-pill px-3 shadow-sm">
                          Manage <i className="bi bi-arrow-right ms-1"></i>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <PaginationControl
                currentPage={currentPage}
                totalPages={Math.max(1, Math.ceil(cadences.length / pageSize))}
                totalItems={cadences.length}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                itemName="cadences"
              />
            </>
          ) : (
            <div className="text-center text-muted py-5">
              <i className="bi bi-diagram-3 fs-1 d-block mb-3 opacity-25"></i>
              No cadences found.
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleClose} backdrop="static" size="lg">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Create Cadence</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {formError && <AlertMessage message={formError} />}
            
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-medium text-secondary small text-uppercase">Client</Form.Label>
                  <Form.Select name="clientId" value={formData.clientId} onChange={handleChange} required>
                    <option value="">-- Select Client --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-medium text-secondary small text-uppercase">Lead List</Form.Label>
                  <Form.Select name="leadListId" value={formData.leadListId} onChange={handleChange} required disabled={!formData.clientId}>
                    <option value="">-- Select Lead List --</option>
                    {leadLists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="mb-3">
              <Form.Group>
                <Form.Label className="fw-medium text-secondary small text-uppercase">Cadence Name</Form.Label>
                <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Q4 Executive Outreach" required />
              </Form.Group>
            </div>

            <div className="mb-4">
              <Form.Group>
                <Form.Label className="fw-medium text-secondary small text-uppercase">Description</Form.Label>
                <Form.Control as="textarea" rows={2} name="description" value={formData.description} onChange={handleChange} placeholder="Optional details about this motion..." />
              </Form.Group>
            </div>

            <h6 className="fw-bold text-dark mb-3"><i className="bi bi-cash me-2 text-success"></i>Billing Configuration</h6>
            <div className="p-3 bg-light rounded-3 border">
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium text-secondary small text-uppercase">Pricing Model</Form.Label>
                <Form.Select name="pricingModel" value={formData.pricingModel} onChange={handleChange} required>
                  <option value="cost_per_lead">Cost Per Lead (Billed on Conversion)</option>
                  <option value="flat_retainer">Flat Retainer (Fixed Fee)</option>
                  <option value="">Unpriced</option>
                </Form.Select>
              </Form.Group>

              {formData.pricingModel === "cost_per_lead" && (
                <Form.Group>
                  <Form.Label className="fw-medium text-secondary small text-uppercase">Rate Per Lead ($)</Form.Label>
                  <Form.Control type="number" step="0.01" name="ratePerLead" value={formData.ratePerLead} onChange={handleChange} required placeholder="e.g. 50.00" />
                </Form.Group>
              )}

              {formData.pricingModel === "flat_retainer" && (
                <Form.Group>
                  <Form.Label className="fw-medium text-secondary small text-uppercase">Flat Retainer Amount ($)</Form.Label>
                  <Form.Control type="number" step="0.01" name="retainerAmount" value={formData.retainerAmount} onChange={handleChange} required placeholder="e.g. 5000.00" />
                </Form.Group>
              )}
            </div>

          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Cadence"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </AppLayout>
  );
}
