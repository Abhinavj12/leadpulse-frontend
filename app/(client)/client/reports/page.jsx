"use client";

import { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Nav from "react-bootstrap/Nav";
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

export default function ClientReportsHubPage() {
  const [sequences, setSequences] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingKey, setDownloadingKey] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", variant: "danger" });

  // Pagination states
  const [seqPage, setSeqPage] = useState(1);
  const [seqPageSize, setSeqPageSize] = useState(10);
  const [campPage, setCampPage] = useState(1);
  const [campPageSize, setCampPageSize] = useState(10);

  useEffect(() => {
    let mounted = true;
    const fetchDeliverables = async () => {
      try {
        const [seqRes, campRes] = await Promise.all([
          api.get("/portal/sequences"),
          api.get("/portal/campaigns")
        ]);

        if (mounted) {
          setSequences(seqRes.data.data || []);
          setCampaigns(campRes.data.data || []);
          setError("");
        }
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, "Failed to load report deliverables."));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchDeliverables();
    return () => { mounted = false; };
  }, []);

  // Reset pagination when search query changes
  useEffect(() => {
    setSeqPage(1);
    setCampPage(1);
  }, [search, seqPageSize, campPageSize]);

  const downloadFile = async (type, id, name, format) => {
    try {
      setDownloadingKey(`${type}-${id}-${format}`);
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const endpoint = type === 'sequence' 
        ? `/reports/sequences/${id}/${format}`
        : `/reports/campaigns/${id}/${format}`;

      const res = await api.get(endpoint, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${name.replace(/\s+/g, '_')}_${type === 'sequence' ? 'Motion' : 'Campaign'}_Report.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      setToast({ show: true, message: `Failed to download ${format.toUpperCase()} report.`, variant: "danger" });
    } finally {
      setDownloadingKey(null);
    }
  };

  const filteredSequences = sequences.filter(s => 
    !search || s.name?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCampaigns = campaigns.filter(c => 
    !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Paginated data calculations
  const seqTotalItems = filteredSequences.length;
  const seqTotalPages = Math.ceil(seqTotalItems / seqPageSize) || 1;
  const paginatedSequences = filteredSequences.slice((seqPage - 1) * seqPageSize, seqPage * seqPageSize);

  const campTotalItems = filteredCampaigns.length;
  const campTotalPages = Math.ceil(campTotalItems / campPageSize) || 1;
  const paginatedCampaigns = filteredCampaigns.slice((campPage - 1) * campPageSize, campPage * campPageSize);

  if (loading) return <AppLayout role="client"><LoadingSpinner /></AppLayout>;
  if (error) return <AppLayout role="client"><AlertMessage message={error} /></AppLayout>;

  return (
    <AppLayout role="client">
      <PageHeader 
        title="Reports & Deliverables Hub" 
        subtitle="Download official PDF performance summaries and Excel lead exports for your motions and campaigns." 
      />

      {/* TAB & SEARCH SELECTOR */}
      <Card className="border-0 shadow-sm rounded-3 mb-4">
        <Card.Body className="p-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <Nav variant="pills" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
              <Nav.Item>
                <Nav.Link eventKey="all" className="rounded-pill px-4 py-2">
                  All Deliverables ({filteredSequences.length + filteredCampaigns.length})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="sequences" className="rounded-pill px-4 py-2">
                  Sequence Motions ({filteredSequences.length})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="campaigns" className="rounded-pill px-4 py-2">
                  Campaigns ({filteredCampaigns.length})
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <InputGroup style={{ maxWidth: "300px" }}>
              <InputGroup.Text className="bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search reports by title..."
                className="border-start-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          </div>
        </Card.Body>
      </Card>

      {/* SEQUENCE DELIVERABLES */}
      {(activeTab === 'all' || activeTab === 'sequences') && (
        <Card className="border-0 shadow-sm rounded-3 mb-4">
          <Card.Header className="bg-white border-0 pt-4 px-4 pb-2 fw-bold d-flex justify-content-between align-items-center">
            <span><i className="bi bi-diagram-3 text-primary me-2"></i> Sequence Motion Reports (PDF & Excel)</span>
            <Badge bg="primary" pill>{filteredSequences.length}</Badge>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th>Motion Name</th>
                  <th>Pricing Model</th>
                  <th className="text-center">Unique Reached</th>
                  <th className="text-center">Conversions</th>
                  <th className="text-end">Download Deliverable</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSequences.length > 0 ? (
                  paginatedSequences.map((seq, idx) => (
                    <tr key={seq.id ? `seq-${seq.id}-${idx}` : idx}>
                      <td className="fw-bold text-dark">{seq.name}</td>
                      <td className="text-capitalize">{seq.billing?.pricingModel?.replace('_', ' ') || 'Unpriced'}</td>
                      <td className="text-center fw-semibold">{seq.totals?.uniqueLeadsReached || 0}</td>
                      <td className="text-center fw-bold text-success">{seq.totals?.convertedLeads ?? seq.totals?.conversions ?? 0}</td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="rounded-pill px-3"
                            disabled={downloadingKey === `sequence-${seq.id}-pdf`}
                            onClick={() => downloadFile('sequence', seq.id, seq.name, 'pdf')}
                          >
                            <i className="bi bi-file-pdf me-1"></i> PDF Summary
                          </Button>
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="rounded-pill px-3"
                            disabled={downloadingKey === `sequence-${seq.id}-excel`}
                            onClick={() => downloadFile('sequence', seq.id, seq.name, 'excel')}
                          >
                            <i className="bi bi-file-excel me-1"></i> Excel Rollup
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">No sequence motion reports found.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>

          {/* SEQUENCE PAGINATION CONTROL */}
          <PaginationControl
            currentPage={seqPage}
            totalPages={seqTotalPages}
            totalItems={seqTotalItems}
            pageSize={seqPageSize}
            onPageChange={setSeqPage}
            onPageSizeChange={setSeqPageSize}
            itemName="sequence reports"
          />
        </Card>
      )}

      {/* CAMPAIGN DELIVERABLES */}
      {(activeTab === 'all' || activeTab === 'campaigns') && (
        <Card className="border-0 shadow-sm rounded-3 mb-4">
          <Card.Header className="bg-white border-0 pt-4 px-4 pb-2 fw-bold d-flex justify-content-between align-items-center">
            <span><i className="bi bi-megaphone text-success me-2"></i> Individual Campaign Reports (PDF & Excel)</span>
            <Badge bg="success" pill>{filteredCampaigns.length}</Badge>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th>Campaign Name</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th className="text-center">Audience Size</th>
                  <th className="text-end">Download Deliverable</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCampaigns.length > 0 ? (
                  paginatedCampaigns.map((camp, idx) => (
                    <tr key={camp.id ? `camp-${camp.id}-${idx}` : idx}>
                      <td className="fw-bold text-dark">{camp.name}</td>
                      <td>
                        <Badge bg={camp.type === 'email' ? 'primary' : 'success'} className="text-uppercase">
                          {camp.type}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={camp.status === 'completed' ? 'success' : camp.status === 'active' ? 'primary' : 'secondary'} className="text-uppercase">
                          {camp.status}
                        </Badge>
                      </td>
                      <td className="text-center fw-semibold">{camp.audienceCount || 0}</td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="rounded-pill px-3"
                            disabled={downloadingKey === `campaign-${camp.id}-pdf`}
                            onClick={() => downloadFile('campaign', camp.id, camp.name, 'pdf')}
                          >
                            <i className="bi bi-file-pdf me-1"></i> PDF Summary
                          </Button>
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="rounded-pill px-3"
                            disabled={downloadingKey === `campaign-${camp.id}-excel`}
                            onClick={() => downloadFile('campaign', camp.id, camp.name, 'excel')}
                          >
                            <i className="bi bi-file-excel me-1"></i> Excel Leads
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">No campaign reports found.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>

          {/* CAMPAIGN PAGINATION CONTROL */}
          <PaginationControl
            currentPage={campPage}
            totalPages={campTotalPages}
            totalItems={campTotalItems}
            pageSize={campPageSize}
            onPageChange={setCampPage}
            onPageSizeChange={setCampPageSize}
            itemName="campaign reports"
          />
        </Card>
      )}

      <ToastNotification show={toast.show} onClose={() => setToast(t => ({ ...t, show: false }))} message={toast.message} variant={toast.variant} />
    </AppLayout>
  );
}

