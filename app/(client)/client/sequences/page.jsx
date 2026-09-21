"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

export default function ClientSequencesPage() {
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

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
      alert(`Failed to download sequence ${format.toUpperCase()} report.`);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <AppLayout role="client"><LoadingSpinner /></AppLayout>;
  if (error) return <AppLayout role="client"><AlertMessage message={error} /></AppLayout>;

  return (
    <AppLayout role="client">
      <PageHeader 
        title="Outreach Motions (Sequences)" 
        subtitle="Contracted multi-step campaigns combining email touches and call follow-ups." 
      />

      <Row className="g-4 mb-4">
        {sequences.map((seq, idx) => {
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

        {sequences.length === 0 && (
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
    </AppLayout>
  );
}
