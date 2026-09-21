"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Pagination from "react-bootstrap/Pagination";

import AppLayout from "@/components/layout/AppLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

export default function LeadListDetailsPage({ params }) {
  const unwrappedParams = use(params);
  const leadListId = unwrappedParams.id;

  const [leadList, setLeadList] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [filters, setFilters] = useState({
    status: "",
    industry: "",
    jobTitle: "",
    source: "",
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 1
  });

  useEffect(() => {
    let mounted = true;
    const fetchList = async () => {
      try {
        const res = await api.get(`/lead-lists/${leadListId}`);
        if (mounted) setLeadList(res.data.data);
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, "Failed to load lead list details."));
      }
    };
    fetchList();
    return () => { mounted = false; };
  }, [leadListId]);

  const loadLeads = async (currentPage = pagination.page, currentFilters = filters) => {
    if (!leadList?.clientId) return;
    
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        clientId: leadList.clientId,
        leadListId,
        page: currentPage,
        pageSize: pagination.pageSize,
      });
      
      if (currentFilters.status) queryParams.append("status", currentFilters.status);
      if (currentFilters.industry) queryParams.append("industry", currentFilters.industry);
      if (currentFilters.jobTitle) queryParams.append("jobTitle", currentFilters.jobTitle);
      if (currentFilters.source) queryParams.append("source", currentFilters.source);
      
      const res = await api.get(`/leads?${queryParams.toString()}`);
      setLeads(res.data.data.items || res.data.data);
      if (res.data.data.pagination) {
        setPagination(res.data.data.pagination);
      }
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load leads."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadList?.clientId) {
      loadLeads(1, filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadList?.clientId]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    loadLeads(1, filters);
  };

  const handleClearFilters = () => {
    const emptyFilters = { status: "", industry: "", jobTitle: "", source: "" };
    setFilters(emptyFilters);
    loadLeads(1, emptyFilters);
  };

  const handlePageChange = (newPage) => {
    loadLeads(newPage, filters);
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

  if (!leadList && loading) {
    return (
      <AppLayout role="manager">
        <div className="p-5 d-flex justify-content-center"><LoadingSpinner /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="manager">
      <div className="mb-3">
        <Link href="/manager/lead-lists" className="text-decoration-none text-secondary small fw-bold">
          <i className="bi bi-arrow-left me-1"></i> Back to Lead Lists
        </Link>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bolder mb-1 text-dark tracking-tight">{leadList?.name || "Lead List"}</h3>
          <p className="text-secondary small mb-0">Browse and filter leads within this list.</p>
        </div>
      </div>

      {error && <AlertMessage message={error} />}

      <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
        <Card.Body className="p-4">
          <Form onSubmit={handleApplyFilters}>
            <Row className="g-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Status</Form.Label>
                  <Form.Select name="status" value={filters.status} onChange={handleFilterChange} className="shadow-none">
                    <option value="">All Statuses</option>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Converted">Converted</option>
                    <option value="Dead">Dead</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Industry</Form.Label>
                  <Form.Control type="text" name="industry" value={filters.industry} onChange={handleFilterChange} placeholder="e.g. Technology" className="shadow-none" />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Job Title</Form.Label>
                  <Form.Control type="text" name="jobTitle" value={filters.jobTitle} onChange={handleFilterChange} placeholder="e.g. CEO" className="shadow-none" />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Source</Form.Label>
                  <Form.Control type="text" name="source" value={filters.source} onChange={handleFilterChange} placeholder="e.g. Web" className="shadow-none" />
                </Form.Group>
              </Col>
              <Col md={2} className="d-flex align-items-end">
                <Button type="submit" variant="primary" className="w-100 fw-medium shadow-sm me-2">Filter</Button>
                <Button type="button" variant="light" onClick={handleClearFilters} className="px-3" title="Clear Filters"><i className="bi bi-x-lg"></i></Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Card.Body className="p-0">
          {loading ? (
            <div className="p-5 d-flex justify-content-center">
              <LoadingSpinner />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-search fs-1 d-block mb-3 opacity-25"></i>
              No leads found matching your criteria.
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead className="bg-light text-muted">
                  <tr>
                    <th className="px-4 py-3 fw-semibold border-bottom-0">Name</th>
                    <th className="px-4 py-3 fw-semibold border-bottom-0">Company</th>
                    <th className="px-4 py-3 fw-semibold border-bottom-0">Job Title</th>
                    <th className="px-4 py-3 fw-semibold border-bottom-0">Industry</th>
                    <th className="px-4 py-3 fw-semibold border-bottom-0">Status</th>
                    <th className="px-4 py-3 fw-semibold border-bottom-0 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="px-4 py-3 fw-medium text-dark">
                        {lead.firstName} {lead.lastName}
                        {lead.dnc && <span className="ms-2 badge bg-danger text-white px-2 py-1" style={{fontSize: '0.65rem'}}>DNC</span>}
                      </td>
                      <td className="px-4 py-3 text-secondary">{lead.company}</td>
                      <td className="px-4 py-3 text-secondary">{lead.jobTitle}</td>
                      <td className="px-4 py-3 text-secondary">{lead.industry}</td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusBadgeVariant(lead.status)}>{lead.status || 'New'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Link href={`/manager/leads/${lead.id}?clientId=${leadList.clientId}`} className="btn btn-sm btn-light rounded-pill px-3 shadow-sm text-primary fw-medium">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
        
        {pagination.totalPages > 1 && (
          <Card.Footer className="bg-white py-3 border-top d-flex justify-content-between align-items-center px-4">
            <span className="text-muted small fw-medium">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <Pagination className="mb-0">
              <Pagination.Prev disabled={pagination.page === 1} onClick={() => handlePageChange(pagination.page - 1)} />
              <Pagination.Item active>{pagination.page}</Pagination.Item>
              <Pagination.Next disabled={pagination.page === pagination.totalPages} onClick={() => handlePageChange(pagination.page + 1)} />
            </Pagination>
          </Card.Footer>
        )}
      </Card>
    </AppLayout>
  );
}
