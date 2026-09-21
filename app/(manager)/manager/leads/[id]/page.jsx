"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";

import AppLayout from "@/components/layout/AppLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

export default function LeadDetailsPage({ params }) {
  const unwrappedParams = use(params);
  const leadId = unwrappedParams.id;
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  const router = useRouter();

  const [lead, setLead] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [statusUpdateTarget, setStatusUpdateTarget] = useState(null); // { listId, currentStatus }
  const [newStatus, setNewStatus] = useState("");

  const loadLead = async () => {
    if (!clientId) {
      setError("Missing clientId.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [leadRes, historyRes] = await Promise.all([
        api.get(`/leads/${leadId}?clientId=${clientId}`),
        api.get(`/leads/${leadId}/history?clientId=${clientId}`)
      ]);
      setLead(leadRes.data.data);
      setHistory(historyRes.data.data);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load lead details."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, clientId]);

  const toggleDnc = async () => {
    if (!confirm(`Are you sure you want to ${lead.dnc ? 'remove from' : 'add to'} Do Not Contact?`)) return;
    try {
      await api.patch(`/leads/${leadId}/dnc`, { clientId, dnc: !lead.dnc });
      setSuccessMessage(`DNC status updated successfully.`);
      setTimeout(() => setSuccessMessage(""), 3000);
      loadLead();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update DNC status."));
    }
  };

  const updateStatus = async () => {
    if (!statusUpdateTarget || !newStatus) return;
    try {
      await api.patch(`/leads/${leadId}/status`, {
        leadListId: statusUpdateTarget.listId,
        status: newStatus
      });
      setSuccessMessage(`Status updated successfully.`);
      setTimeout(() => setSuccessMessage(""), 3000);
      setStatusUpdateTarget(null);
      setNewStatus("");
      loadLead();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update status."));
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'secondary';
      case 'contacted': return 'info';
      case 'qualified': return 'primary';
      case 'converted': return 'success';
      case 'dead': return 'danger';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <AppLayout role="manager">
        <div className="p-5 d-flex justify-content-center"><LoadingSpinner /></div>
      </AppLayout>
    );
  }

  if (error && !lead) {
    return (
      <AppLayout role="manager">
        <AlertMessage message={error} />
        <Button variant="outline-primary" onClick={() => router.back()}>Go Back</Button>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="manager">
      <div className="mb-3">
        <Button variant="link" onClick={() => router.back()} className="text-decoration-none text-secondary small fw-bold p-0">
          <i className="bi bi-arrow-left me-1"></i> Back
        </Button>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bolder mb-1 text-dark tracking-tight d-flex align-items-center">
            {lead.firstName} {lead.lastName}
            {lead.dnc && <span className="badge bg-danger text-white ms-3 px-2 py-1 fs-6 rounded-pill">DO NOT CONTACT</span>}
          </h3>
          <p className="text-secondary mb-0">{lead.jobTitle} at {lead.company}</p>
        </div>
        <div>
          <Button 
            variant={lead.dnc ? "outline-secondary" : "outline-danger"} 
            className="fw-medium rounded-pill shadow-sm bg-white"
            onClick={toggleDnc}
          >
            {lead.dnc ? "Remove DNC" : "Mark as DNC"}
          </Button>
        </div>
      </div>

      {error && <AlertMessage message={error} />}
      {successMessage && <AlertMessage variant="success" message={successMessage} />}

      <Row className="g-4">
        <Col md={5}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-bottom py-3">
              <h5 className="mb-0 fw-bold"><i className="bi bi-person-lines-fill text-primary me-2"></i>Contact Details</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <dl className="row mb-0">
                <dt className="col-sm-4 text-muted fw-medium mb-3">Email</dt>
                <dd className="col-sm-8 mb-3"><a href={`mailto:${lead.email}`} className="text-decoration-none">{lead.email}</a></dd>

                <dt className="col-sm-4 text-muted fw-medium mb-3">Phone</dt>
                <dd className="col-sm-8 mb-3"><a href={`tel:${lead.phone}`} className="text-decoration-none text-dark">{lead.phone || "—"}</a></dd>

                <dt className="col-sm-4 text-muted fw-medium mb-3">Industry</dt>
                <dd className="col-sm-8 mb-3 text-dark">{lead.industry || "—"}</dd>

                <dt className="col-sm-4 text-muted fw-medium mb-3">Source</dt>
                <dd className="col-sm-8 mb-3 text-dark">{lead.source || "—"}</dd>

                <dt className="col-sm-4 text-muted fw-medium mb-0">Added On</dt>
                <dd className="col-sm-8 mb-0 text-dark">{new Date(lead.createdAt).toLocaleDateString()}</dd>
              </dl>
            </Card.Body>
          </Card>
        </Col>

        <Col md={7}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-bottom py-3">
              <h5 className="mb-0 fw-bold"><i className="bi bi-list-check text-primary me-2"></i>List Memberships & Status</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {lead.memberships?.length > 0 ? (
                <Table hover className="mb-0 align-middle">
                  <thead className="bg-light text-muted">
                    <tr>
                      <th className="px-4 py-3 border-bottom-0 fw-semibold">Lead List</th>
                      <th className="px-4 py-3 border-bottom-0 fw-semibold">Status</th>
                      <th className="px-4 py-3 border-bottom-0 fw-semibold text-end">Override</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lead.memberships.map(mem => (
                      <tr key={mem.leadListId}>
                        <td className="px-4 py-3 fw-medium text-dark">{mem.leadListName}</td>
                        <td className="px-4 py-3">
                          <Badge variant={getStatusBadgeVariant(mem.status)}>{mem.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-end">
                          {statusUpdateTarget?.listId === mem.leadListId ? (
                            <div className="d-flex justify-content-end align-items-center gap-2">
                              <Form.Select 
                                size="sm" 
                                value={newStatus} 
                                onChange={(e) => setNewStatus(e.target.value)}
                                style={{ width: 'auto' }}
                              >
                                <option value="">Select...</option>
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Qualified">Qualified</option>
                                <option value="Converted">Converted</option>
                                <option value="Dead">Dead</option>
                              </Form.Select>
                              <Button size="sm" variant="success" onClick={updateStatus} disabled={!newStatus} className="rounded-pill"><i className="bi bi-check"></i></Button>
                              <Button size="sm" variant="light" onClick={() => { setStatusUpdateTarget(null); setNewStatus(""); }} className="rounded-pill"><i className="bi bi-x"></i></Button>
                            </div>
                          ) : (
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="text-decoration-none p-0 fw-medium"
                              onClick={() => setStatusUpdateTarget({ listId: mem.leadListId, currentStatus: mem.status })}
                            >
                              Edit Status
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center text-muted py-5">
                  This lead is not currently active in any lists.
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={12}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Header className="bg-white border-bottom py-3">
              <h5 className="mb-0 fw-bold"><i className="bi bi-clock-history text-primary me-2"></i>Engagement & Call History</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="p-3 bg-light border-bottom fw-bold text-secondary">Call Remarks</div>
              {history?.callHistory?.length > 0 ? (
                <Table hover className="mb-0 align-middle">
                  <thead className="bg-white text-muted small">
                    <tr>
                      <th className="px-4 py-2 border-bottom-0">Date</th>
                      <th className="px-4 py-2 border-bottom-0">Campaign</th>
                      <th className="px-4 py-2 border-bottom-0">Executive</th>
                      <th className="px-4 py-2 border-bottom-0">Outcome</th>
                      <th className="px-4 py-2 border-bottom-0">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.callHistory.map(call => (
                      <tr key={call.id}>
                        <td className="px-4 py-3 text-secondary">{new Date(call.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3 fw-medium">{call.campaignName}</td>
                        <td className="px-4 py-3">{call.executiveName}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{call.outcome}</Badge>
                        </td>
                        <td className="px-4 py-3 fst-italic text-muted">{call.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center text-muted py-4 small">No call history available for this lead.</div>
              )}

              <div className="p-3 bg-light border-bottom border-top fw-bold text-secondary">Email Engagements</div>
              {history?.emailEngagements?.length > 0 ? (
                <Table hover className="mb-0 align-middle">
                  <thead className="bg-white text-muted small">
                    <tr>
                      <th className="px-4 py-2 border-bottom-0">Campaign</th>
                      <th className="px-4 py-2 border-bottom-0">Status</th>
                      <th className="px-4 py-2 border-bottom-0">Sent At</th>
                      <th className="px-4 py-2 border-bottom-0">Opened</th>
                      <th className="px-4 py-2 border-bottom-0">Clicked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.emailEngagements.map(email => (
                      <tr key={email.id}>
                        <td className="px-4 py-3 fw-medium">{email.campaignName}</td>
                        <td className="px-4 py-3"><Badge variant="info">{email.status}</Badge></td>
                        <td className="px-4 py-3 text-secondary">{email.sentAt ? new Date(email.sentAt).toLocaleString() : "—"}</td>
                        <td className="px-4 py-3 text-secondary">
                          {email.openedAt ? (
                            <span className="text-success"><i className="bi bi-check-circle me-1"></i> {email.openCount} times</span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-secondary">
                          {email.clickedAt ? (
                            <span className="text-success"><i className="bi bi-check-circle me-1"></i> {email.clickCount} times</span>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center text-muted py-4 small">No email engagement history available for this lead.</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </AppLayout>
  );
}
