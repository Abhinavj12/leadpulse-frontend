"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import { ToastNotification } from "@/components/ui/ToastNotification";
import { PaginationControl } from "@/components/ui/PaginationControl";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

function ClientCampaignsContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "all";

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [downloadingId, setDownloadingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", variant: "danger" });

  useEffect(() => {
    const queryType = searchParams.get("type");
    if (queryType) {
      setTypeFilter(queryType);
    }
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;
    const fetchCampaigns = async () => {
      try {
        const res = await api.get("/portal/campaigns");
        if (mounted) {
          setCampaigns(res.data.data || []);
          setError("");
        }
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, "Failed to load campaigns."));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCampaigns();
    return () => { mounted = false; };
  }, []);

  // Reset page when search or type filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, pageSize]);

  const downloadReport = async (campaignId, campaignName, format) => {
    try {
      setDownloadingId(`${campaignId}-${format}`);
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const url = `/reports/campaigns/${campaignId}/${format}`;
      const res = await api.get(url, { responseType: 'blob' });
      
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${campaignName.replace(/\s+/g, '_')}_Report.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      setToast({ show: true, message: `Failed to download ${format.toUpperCase()} report.`, variant: "danger" });
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || c.type?.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  // Calculate stats
  const activeCount = campaigns.filter(c => c.status?.toLowerCase() === 'active').length;
  const completedCount = campaigns.filter(c => c.status?.toLowerCase() === 'completed').length;
  const totalAudience = campaigns.reduce((acc, curr) => acc + (curr.audienceCount || 0), 0);

  // Pagination calculation
  const totalItems = filteredCampaigns.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedCampaigns = filteredCampaigns.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) return <AppLayout role="client"><LoadingSpinner /></AppLayout>;
  if (error) return <AppLayout role="client"><AlertMessage message={error} /></AppLayout>;

  return (
    <AppLayout role="client">
      <PageHeader 
        title="Outreach Campaigns" 
        subtitle="Detailed history of email and call campaigns run for your account." 
      />

      {/* EXECUTIVE SUMMARY KPIS */}
      <Row className="mb-4 g-3">
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold text-uppercase">Total Campaigns</div>
                <div className="fs-4 fw-bold text-dark">{campaigns.length}</div>
              </div>
              <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle">
                <i className="bi bi-megaphone fs-4"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold text-uppercase">Active Channels</div>
                <div className="fs-4 fw-bold text-primary">{activeCount}</div>
              </div>
              <div className="bg-info bg-opacity-10 text-info p-2 rounded-circle">
                <i className="bi bi-play-circle fs-4"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold text-uppercase">Completed</div>
                <div className="fs-4 fw-bold text-success">{completedCount}</div>
              </div>
              <div className="bg-success bg-opacity-10 text-success p-2 rounded-circle">
                <i className="bi bi-check-circle fs-4"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold text-uppercase">Total Audience</div>
                <div className="fs-4 fw-bold text-dark">{totalAudience}</div>
              </div>
              <div className="bg-warning bg-opacity-10 text-warning p-2 rounded-circle">
                <i className="bi bi-people fs-4"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* FILTER & SEARCH BAR */}
      <Card className="border-0 shadow-sm rounded-3 mb-4">
        <Card.Body className="p-3">
          <div className="d-flex flex-column flex-md-row gap-3 justify-content-between align-items-center">
            <InputGroup style={{ maxWidth: "360px" }}>
              <InputGroup.Text className="bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search campaigns by name..."
                className="border-start-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>

            <div className="d-flex gap-2">
              <Form.Select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ width: "180px" }}
              >
                <option value="all">All Channels</option>
                <option value="email">Email Campaigns</option>
                <option value="call">Call Campaigns</option>
              </Form.Select>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* CAMPAIGN LIST TABLE */}
      <Card className="border-0 shadow-sm rounded-3">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th>Campaign Name</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Motion Context</th>
                <th className="text-center">Audience Size</th>
                <th>Date Approved</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCampaigns.length > 0 ? (
                paginatedCampaigns.map((c, idx) => {
                  const isEmail = c.type?.toLowerCase() === 'email';
                  const status = c.status?.toLowerCase();
                  return (
                    <tr key={c.id ? `${c.id}-${idx}` : idx}>
                      <td className="fw-medium">
                        <Link href={`/client/campaigns/${c.id}`} className="text-decoration-none text-dark fw-bold hover-primary">
                          {c.name}
                        </Link>
                      </td>
                      <td>
                        <Badge bg={isEmail ? 'primary' : 'success'} className="px-2 py-1 text-uppercase">
                          <i className={`bi bi-${isEmail ? 'envelope' : 'telephone'} me-1`}></i>
                          {c.type}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={
                          status === 'completed' ? 'success' :
                          status === 'active' ? 'primary' :
                          status === 'paused' ? 'warning text-dark' : 'secondary'
                        } className="text-uppercase px-2 py-1">
                          {c.status}
                        </Badge>
                      </td>
                    <td>
                      {c.isStandalone ? (
                        <span className="text-muted small">Standalone</span>
                      ) : (
                        <Badge bg="info" className="text-dark small">
                          Step {c.sequenceStepOrder || 1} of Motion
                        </Badge>
                      )}
                    </td>
                    <td className="text-center fw-semibold">{c.audienceCount || 0}</td>
                    <td className="text-muted small">
                      {c.approvedAt ? new Date(c.approvedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-1">
                        <Link href={`/client/campaigns/${c.id}`}>
                          <Button variant="outline-primary" size="sm" className="rounded-2">
                            <i className="bi bi-eye me-1"></i> View Analytics
                          </Button>
                        </Link>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          disabled={downloadingId === `${c.id}-pdf`}
                          onClick={() => downloadReport(c.id, c.name, 'pdf')}
                          title="Download PDF Report"
                        >
                          <i className="bi bi-file-pdf"></i>
                        </Button>
                        <Button 
                          variant="outline-success" 
                          size="sm"
                          disabled={downloadingId === `${c.id}-excel`}
                          onClick={() => downloadReport(c.id, c.name, 'excel')}
                          title="Download Excel Leads Report"
                        >
                          <i className="bi bi-file-excel"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-5">
                    No active or completed campaigns match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>

        {/* PAGINATION CONTROL */}
        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="campaigns"
        />
      </Card>
      <ToastNotification show={toast.show} onClose={() => setToast(t => ({ ...t, show: false }))} message={toast.message} variant={toast.variant} />
    </AppLayout>
  );
}

export default function ClientCampaignsPage() {
  return (
    <Suspense fallback={<AppLayout role="client"><LoadingSpinner /></AppLayout>}>
      <ClientCampaignsContent />
    </Suspense>
  );
}

