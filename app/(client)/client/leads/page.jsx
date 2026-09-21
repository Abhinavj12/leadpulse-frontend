"use client";

import { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Nav from "react-bootstrap/Nav";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

export default function ClientLeadsCRM() {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLeads = async (page = 1, status = statusFilter) => {
    try {
      setLoading(true);
      let url = `/portal/leads?page=${page}&pageSize=25`;
      if (status && status !== "all") url += `&status=${status}`;

      const res = await api.get(url);
      setLeads(res.data.data?.leads || []);
      setPagination(res.data.data?.pagination || { page: 1, pageSize: 25, total: 0, totalPages: 1 });
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load leads."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(1, statusFilter);
  }, [statusFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLeads(newPage, statusFilter);
    }
  };

  const filteredLeads = leads.filter(l => {
    if (!search) return true;
    const term = search.toLowerCase();
    const company = (l.company || "").toLowerCase();
    const title = (l.jobTitle || "").toLowerCase();
    const industry = (l.industry || "").toLowerCase();
    const name = l.firstName !== 'Hidden' ? `${l.firstName} ${l.lastName}`.toLowerCase() : '';
    return company.includes(term) || title.includes(term) || industry.includes(term) || name.includes(term);
  });

  return (
    <AppLayout role="client">
      <PageHeader 
        title="Funnel Leads CRM" 
        subtitle="Real-time prospect funnel tracking. Identities are automatically unlocked upon Qualification." 
      />

      {/* REDACTION BOUNDARY NOTICE */}
      <AlertMessage 
        variant="info" 
        message="Privacy & Quality Assurance Guard: Basic target profiles (Company, Title, Industry) are visible for all targeted prospects. Direct contact identities (Name, Email, Phone) are unlocked as soon as an executive qualifies or converts a lead." 
      />

      {/* FILTER & SEARCH CARD */}
      <Card className="border-0 shadow-sm rounded-3 mb-4">
        <Card.Body className="p-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <Nav variant="pills" activeKey={statusFilter} onSelect={(selectedKey) => setStatusFilter(selectedKey)}>
              <Nav.Item>
                <Nav.Link eventKey="all" className="rounded-pill px-3 py-1">All Statuses</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="New" className="rounded-pill px-3 py-1">New</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="Contacted" className="rounded-pill px-3 py-1">Contacted</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="Qualified" className="rounded-pill px-3 py-1 fw-bold text-primary">Qualified</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="Converted" className="rounded-pill px-3 py-1 fw-bold text-success">Converted</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="Dead" className="rounded-pill px-3 py-1 text-secondary">Dead</Nav.Link>
              </Nav.Item>
            </Nav>

            <InputGroup style={{ maxWidth: "300px" }}>
              <InputGroup.Text className="bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search leads..."
                className="border-start-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          </div>
        </Card.Body>
      </Card>

      {/* LEADS TABLE */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <AlertMessage message={error} />
      ) : (
        <Card className="border-0 shadow-sm rounded-3">
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th>Status</th>
                  <th>Target Profile (Title & Company)</th>
                  <th>Prospect Name</th>
                  <th>Contact Info</th>
                  <th>Lead List</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead, idx) => {
                    const isRevealed = lead.status === 'Qualified' || lead.status === 'Converted';

                    return (
                      <tr key={lead.membershipId || `${lead.id}-${idx}`}>
                        <td>
                          <Badge bg={
                            lead.status === 'Converted' ? 'success' :
                            lead.status === 'Qualified' ? 'primary' :
                            lead.status === 'Dead' ? 'secondary' :
                            lead.status === 'Contacted' ? 'warning text-dark' : 'info text-dark'
                          } className="text-uppercase px-2 py-1">
                            {lead.status || 'New'}
                          </Badge>
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{lead.jobTitle || 'Decision Maker'}</div>
                          <div className="text-muted small">
                            at <span className="fw-medium">{lead.company || 'Target Organization'}</span> ({lead.industry || 'Industry N/A'})
                          </div>
                        </td>
                        <td>
                          {isRevealed ? (
                            <span className="fw-bold text-success d-flex align-items-center">
                              <i className="bi bi-unlock-fill me-1"></i>
                              {lead.firstName} {lead.lastName}
                            </span>
                          ) : (
                            <span className="text-muted fst-italic d-flex align-items-center">
                              <i className="bi bi-lock-fill me-1 text-secondary"></i>
                              Redacted
                            </span>
                          )}
                        </td>
                        <td>
                          {isRevealed ? (
                            <div className="small">
                              <div className="text-dark"><i className="bi bi-envelope me-1 text-muted"></i>{lead.email}</div>
                              {lead.phone && <div className="text-muted"><i className="bi bi-telephone me-1 text-muted"></i>{lead.phone}</div>}
                            </div>
                          ) : (
                            <span className="text-muted small fst-italic">Unlocked on Qualification</span>
                          )}
                        </td>
                        <td className="text-muted small">
                          {lead.listName || 'Campaign Audience'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-5">
                      No leads found matching your selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>

          {/* PAGINATION FOOTER */}
          {pagination.totalPages > 1 && (
            <Card.Footer className="bg-white border-0 p-3 d-flex justify-content-between align-items-center">
              <span className="text-muted small">
                Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} Total Leads)
              </span>
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  <i className="bi bi-chevron-left me-1"></i> Previous
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next <i className="bi bi-chevron-right ms-1"></i>
                </Button>
              </div>
            </Card.Footer>
          )}
        </Card>
      )}
    </AppLayout>
  );
}
