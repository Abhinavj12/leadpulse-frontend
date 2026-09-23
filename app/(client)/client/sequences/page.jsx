"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";
import { ToastNotification } from "@/components/ui/ToastNotification";
import { PaginationControl } from "@/components/ui/PaginationControl";

export default function ClientSequencesPage() {
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [downloadingId, setDownloadingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", variant: "danger" });

  useEffect(() => {
    let mounted = true;
    const fetchSequences = async () => {
      try {
        const res = await api.get("/portal/sequences");
        if (mounted) {
          setSequences(res.data.data || []);
          setError("");
        }
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, "Failed to load outreach motions."));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSequences();
    return () => { mounted = false; };
  }, []);

  // Reset page when search or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  const downloadSequenceReport = async (seqId, seqName, format) => {
    try {
      setDownloadingId(`${seqId}-${format}`);
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const url = `/reports/sequences/${seqId}/${format}`;
      const res = await api.get(url, { responseType: 'blob' });
      
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${seqName.replace(/\s+/g, '_')}_Motion_Report.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      setToast({ show: true, message: `Failed to download sequence ${format.toUpperCase()} report.`, variant: "danger" });
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredSequences = sequences.filter(s => {
    if (!search) return true;
    const term = search.toLowerCase();
    return s.name?.toLowerCase().includes(term) || s.description?.toLowerCase().includes(term);
  });

  // KPI Calculations
  const totalUniqueProspects = sequences.reduce((acc, curr) => acc + (curr.totals?.uniqueLeadsReached || 0), 0);
  const totalConversions = sequences.reduce((acc, curr) => acc + (curr.totals?.convertedLeads ?? curr.totals?.conversions ?? 0), 0);

  // Pagination calculation
  const totalItems = filteredSequences.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedSequences = filteredSequences.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) return <AppLayout role="client"><LoadingSpinner /></AppLayout>;
  if (error) return <AppLayout role="client"><AlertMessage message={error} /></AppLayout>;

  return (
    <AppLayout role="client">
      <PageHeader 
        title="Outreach Motions (Sequences)" 
        subtitle="Contracted multi-step campaigns combining email touches and call follow-ups." 
      />

      {/* KPI SUMMARY CARDS */}
      <Row className="mb-4 g-3">
        <Col md={4} sm={6}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold text-uppercase">Active Motions</div>
                <div className="fs-4 fw-bold text-dark">{sequences.length}</div>
              </div>
              <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle">
                <i className="bi bi-diagram-3 fs-4"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} sm={6}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold text-uppercase">Unique Reached</div>
                <div className="fs-4 fw-bold text-primary">{totalUniqueProspects}</div>
              </div>
              <div className="bg-info bg-opacity-10 text-info p-2 rounded-circle">
                <i className="bi bi-person-check fs-4"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} sm={12}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold text-uppercase">Total Conversions</div>
                <div className="fs-4 fw-bold text-success">{totalConversions}</div>
              </div>
              <div className="bg-success bg-opacity-10 text-success p-2 rounded-circle">
                <i className="bi bi-trophy fs-4"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* SEARCH BAR */}
      <Card className="border-0 shadow-sm rounded-3 mb-4">
        <Card.Body className="p-3">
          <InputGroup style={{ maxWidth: "360px" }}>
            <InputGroup.Text className="bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search motions by title..."
              className="border-start-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </Card.Body>
      </Card>

      {/* SEQUENCES CARDS GRID */}
      <Row className="g-4 mb-4">
        {paginatedSequences.map((seq, idx) => {
          const billing = seq.billing || {};
          const isCostPerLead = billing.pricingModel === 'cost_per_lead';
          const isFlatRetainer = billing.pricingModel === 'flat_retainer';

          return (
            <Col md={6} key={seq.id ? `${seq.id}-${idx}` : idx}>
              <Card className="h-100 border-0 shadow-sm rounded-3">
                <Card.Header className="bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="fw-bold text-dark mb-1">
                      <Link href={`/client/sequences/${seq.id}`} className="text-decoration-none text-dark hover-primary">
                        {seq.name}
                      </Link>
                    </h5>
                    <p className="text-muted small mb-0">{seq.description || "Multi-channel sequence motion"}</p>
                  </div>
                  <Badge bg={isCostPerLead ? 'primary' : isFlatRetainer ? 'success' : 'secondary'} className="px-3 py-2 text-uppercase">
                    {billing.pricingModel ? billing.pricingModel.replace('_', ' ') : 'Unpriced'}
                  </Badge>
                </Card.Header>

                <Card.Body className="p-4">
                  {/* METRICS ROW */}
                  <Row className="g-2 text-center my-2 p-3 bg-light rounded-3">
                    <Col xs={4} className="border-end">
                      <div className="fs-5 fw-bold text-dark">{seq.steps?.length || 0}</div>
                      <div className="text-muted small text-uppercase" style={{ fontSize: '0.7rem' }}>Steps</div>
                    </Col>
                    <Col xs={4} className="border-end">
                      <div className="fs-5 fw-bold text-primary">{seq.totals?.uniqueLeadsReached || 0}</div>
                      <div className="text-muted small text-uppercase" style={{ fontSize: '0.7rem' }}>Prospects</div>
                    </Col>
                    <Col xs={4}>
                      <div className="fs-5 fw-bold text-success">{seq.totals?.convertedLeads ?? seq.totals?.conversions ?? 0}</div>
                      <div className="text-muted small text-uppercase" style={{ fontSize: '0.7rem' }}>Conversions</div>
                    </Col>
                  </Row>

                  {/* PIPELINE STEP BADGES */}
                  <div className="mt-3">
                    <div className="text-muted small fw-semibold mb-2">Motion Pipeline:</div>
                    <div className="d-flex flex-wrap gap-2">
                      {seq.steps && seq.steps.length > 0 ? (
                        seq.steps.map((st, idx) => (
                          <span key={idx} className="badge bg-white border text-dark p-2 d-flex align-items-center gap-1">
                            <span className="badge bg-secondary rounded-circle me-1">{st.stepOrder}</span>
                            <i className={`bi bi-${st.type === 'email' ? 'envelope' : 'telephone'} text-${st.type === 'email' ? 'primary' : 'success'}`}></i>
                            {st.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted small italic">No active steps configured.</span>
                      )}
                    </div>
                  </div>
                </Card.Body>

                <Card.Footer className="bg-white border-0 p-4 pt-0 d-flex justify-content-between align-items-center">
                  <Link href={`/client/sequences/${seq.id}`}>
                    <Button variant="outline-primary" size="sm" className="rounded-pill px-3">
                      View Motion Details <i className="bi bi-arrow-right ms-1"></i>
                    </Button>
                  </Link>

                  <div className="d-flex gap-1">
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      disabled={downloadingId === `${seq.id}-pdf`}
                      onClick={() => downloadSequenceReport(seq.id, seq.name, 'pdf')}
                      title="Download PDF Sequence Report"
                    >
                      <i className="bi bi-file-pdf"></i>
                    </Button>
                    <Button 
                      variant="outline-success" 
                      size="sm"
                      disabled={downloadingId === `${seq.id}-excel`}
                      onClick={() => downloadSequenceReport(seq.id, seq.name, 'excel')}
                      title="Download Excel Sequence Report"
                    >
                      <i className="bi bi-file-excel"></i>
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          );
        })}

        {filteredSequences.length === 0 && (
          <Col md={12}>
            <Card className="border-0 shadow-sm rounded-3">
              <Card.Body className="p-5 text-center text-muted">
                <i className="bi bi-diagram-3 display-4 d-block mb-3 text-secondary opacity-50"></i>
                <h5>No Active Sequences Found</h5>
                <p className="mb-0">Contracted multi-step outreach motions will appear here once approved by your Campaign Manager.</p>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* GRID PAGINATION CONTROL */}
      <Card className="border-0 shadow-sm rounded-3">
        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          pageSizeOptions={[6, 12, 24]}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="outreach motions"
        />
      </Card>

      <ToastNotification show={toast.show} onClose={() => setToast(t => ({ ...t, show: false }))} message={toast.message} variant={toast.variant} />
    </AppLayout>
  );
}

