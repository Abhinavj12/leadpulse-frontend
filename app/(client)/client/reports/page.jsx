"use client";

import React, { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Collapse from "react-bootstrap/Collapse";

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
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingKey, setDownloadingKey] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", variant: "danger" });
  
  const [expandedRows, setExpandedRows] = useState({});

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    setPage(1);
    setExpandedRows({});
  }, [search, pageSize]);

  const downloadFile = async (type, id, name, format, e) => {
    if (e) e.stopPropagation();
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
    } catch (err) {
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

  // Unified list mapping
  const unifiedList = [
    ...filteredSequences.map(seq => ({
      itemType: 'sequence',
      ...seq,
      children: filteredCampaigns
        .filter(c => c.sequenceId === seq.id)
        .sort((a, b) => (a.sequenceStepOrder || 0) - (b.sequenceStepOrder || 0))
    })),
    ...filteredCampaigns.filter(c => !c.sequenceId).map(camp => ({
      itemType: 'campaign',
      ...camp
    }))
  ];

  const totalItems = unifiedList.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedItems = unifiedList.slice((page - 1) * pageSize, page * pageSize);

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <AppLayout role="client"><LoadingSpinner /></AppLayout>;
  if (error) return <AppLayout role="client"><AlertMessage message={error} /></AppLayout>;

  return (
    <AppLayout role="client">
      <PageHeader 
        title="Reports & Deliverables Hub" 
        subtitle="Download official PDF performance summaries and Excel lead exports for your motions and campaigns." 
      />

      {/* SEARCH BAR */}
      <Card className="border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
        <div style={{ height: "4px", background: "linear-gradient(90deg, #0d6efd, #0dcaf0)" }} />
        <Card.Body className="p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h5 className="fw-bold text-dark mb-0">Search Deliverables</h5>
            <span className="text-muted small">Find your reports by sequence or campaign title</span>
          </div>
          <InputGroup style={{ maxWidth: "400px" }} className="shadow-sm">
            <InputGroup.Text className="bg-white border-end-0 border-primary">
              <i className="bi bi-search text-primary"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search reports by title..."
              className="border-start-0 border-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </Card.Body>
      </Card>

      {/* UNIFIED DELIVERABLES TABLE */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <Card.Header className="bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center text-success" style={{ width: 42, height: 42 }}>
              <i className="bi bi-file-earmark-bar-graph fs-5"></i>
            </div>
            <div>
              <h5 className="fw-bold text-dark mb-0">All Reporting Deliverables</h5>
              <span className="text-muted small">Sequence motions and standalone campaigns available for export</span>
            </div>
          </div>
          <Badge bg="success" pill className="fs-6 px-3">{totalItems}</Badge>
        </Card.Header>
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0 align-middle">
            <thead className="bg-light text-muted small text-uppercase" style={{ fontSize: "0.8rem", letterSpacing: "0.5px" }}>
              <tr>
                <th className="py-3 ps-4" style={{ width: '35%' }}>Name / Item</th>
                <th className="py-3 text-center">Type / Model</th>
                <th className="py-3 text-center">Engagement / Status</th>
                <th className="py-3 text-center">Conversions</th>
                <th className="py-3 text-end pe-4">Exports</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? paginatedItems.map(item => {
                if (item.itemType === 'sequence') {
                  const isExpanded = !!expandedRows[item.id];
                  return (
                    <React.Fragment key={`seq-${item.id}`}>
                      <tr 
                        onClick={() => toggleRow(item.id)} 
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                        className={isExpanded ? "bg-light" : ""}
                      >
                        <td className="ps-4 py-3">
                          <div className="d-flex align-items-center gap-2">
                            <Button 
                              variant="link" 
                              className="p-0 text-secondary text-decoration-none"
                              onClick={(e) => { e.stopPropagation(); toggleRow(item.id); }}
                            >
                              <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'} fs-6`}></i>
                            </Button>
                            <div className="rounded bg-primary bg-opacity-10 text-primary p-2 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                              <i className="bi bi-layers-fill"></i>
                            </div>
                            <div>
                              <span className="fw-bold text-dark d-block">{item.name}</span>
                              <span className="text-muted small">Sequence ({item.children.length} motions)</span>
                            </div>
                          </div>
                        </td>
                        <td className="text-center text-muted fw-medium text-capitalize">
                          {item.billing?.pricingModel?.replace('_', ' ') || 'Unpriced'}
                        </td>
                        <td className="text-center fw-semibold">
                          {item.totals?.uniqueLeadsReached || 0} Reached
                        </td>
                        <td className="text-center fw-bold text-success">
                          {item.totals?.convertedLeads ?? item.totals?.conversions ?? 0}
                        </td>
                        <td className="text-end pe-4">
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="rounded-pill px-3 py-1 fw-medium shadow-sm me-2"
                            disabled={downloadingKey === `sequence-${item.id}-pdf`}
                            onClick={(e) => downloadFile('sequence', item.id, item.name, 'pdf', e)}
                          >
                            <i className="bi bi-file-pdf-fill me-1"></i> PDF Summary
                          </Button>
                          <Button 
                            variant="outline-success" 
                            size="sm" 
                            className="rounded-pill px-3 py-1 fw-medium shadow-sm"
                            disabled={downloadingKey === `sequence-${item.id}-excel`}
                            onClick={(e) => downloadFile('sequence', item.id, item.name, 'excel', e)}
                          >
                            <i className="bi bi-file-earmark-excel-fill me-1"></i> Excel Rollup
                          </Button>
                        </td>
                      </tr>
                      {/* Nested Campaigns */}
                      {isExpanded && item.children.map((child, idx) => (
                        <tr key={`camp-${child.id}`} className="bg-white" style={{ borderLeft: '4px solid #0d6efd' }}>
                          <td className="ps-5 py-3">
                            <div className="d-flex align-items-center gap-3 ms-4">
                              <div className="text-muted small fw-bold">#{idx + 1}</div>
                              <div>
                                <span className="fw-semibold text-dark d-block">{child.name}</span>
                                <span className="text-muted small">Campaign Motion</span>
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            <Badge bg={child.type === 'email' ? 'primary' : 'info'} text={child.type === 'email' ? 'light' : 'dark'} className="px-2 py-1 rounded-pill text-uppercase" style={{ fontSize: "0.7rem" }}>
                              <i className={`bi bi-${child.type === 'email' ? 'envelope-fill' : 'telephone-fill'} me-1`}></i>
                              {child.type}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Badge bg={child.status === 'completed' ? 'success' : child.status === 'active' ? 'primary' : 'secondary'} className="px-2 py-1 rounded-pill text-uppercase">
                              {child.status}
                            </Badge>
                          </td>
                          <td className="text-center fw-semibold text-muted">
                            Audience: {child.audienceCount || 0}
                          </td>
                          <td className="text-end pe-4">
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              className="rounded-pill px-3 py-1 fw-medium me-2"
                              disabled={downloadingKey === `campaign-${child.id}-pdf`}
                              onClick={(e) => downloadFile('campaign', child.id, child.name, 'pdf', e)}
                            >
                              PDF
                            </Button>
                            <Button 
                              variant="outline-success" 
                              size="sm" 
                              className="rounded-pill px-3 py-1 fw-medium"
                              disabled={downloadingKey === `campaign-${child.id}-excel`}
                              onClick={(e) => downloadFile('campaign', child.id, child.name, 'excel', e)}
                            >
                              Excel Leads
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                } else {
                  // Standalone campaign
                  return (
                    <tr key={`standalone-${item.id}`}>
                      <td className="ps-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ width: 20 }}></div> {/* alignment spacer */}
                          <div className="rounded bg-info bg-opacity-10 text-info p-2 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                            <i className={`bi bi-${item.type === 'email' ? 'envelope' : 'telephone'}`}></i>
                          </div>
                          <div>
                            <span className="fw-bold text-dark d-block">{item.name}</span>
                            <span className="text-muted small">Standalone Campaign</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <Badge bg={item.type === 'email' ? 'primary' : 'info'} text={item.type === 'email' ? 'light' : 'dark'} className="px-2 py-1 rounded-pill text-uppercase" style={{ fontSize: "0.7rem" }}>
                          <i className={`bi bi-${item.type === 'email' ? 'envelope-fill' : 'telephone-fill'} me-1`}></i>
                          {item.type}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Badge bg={item.status === 'completed' ? 'success' : item.status === 'active' ? 'primary' : 'secondary'} className="px-2 py-1 rounded-pill text-uppercase">
                          {item.status}
                        </Badge>
                      </td>
                      <td className="text-center fw-semibold text-muted">
                        Audience: {item.audienceCount || 0}
                      </td>
                      <td className="text-end pe-4">
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          className="rounded-pill px-3 py-1 fw-medium shadow-sm me-2"
                          disabled={downloadingKey === `campaign-${item.id}-pdf`}
                          onClick={(e) => downloadFile('campaign', item.id, item.name, 'pdf', e)}
                        >
                          <i className="bi bi-file-pdf-fill me-1"></i> PDF Summary
                        </Button>
                        <Button 
                          variant="outline-success" 
                          size="sm" 
                          className="rounded-pill px-3 py-1 fw-medium shadow-sm"
                          disabled={downloadingKey === `campaign-${item.id}-excel`}
                          onClick={(e) => downloadFile('campaign', item.id, item.name, 'excel', e)}
                        >
                          <i className="bi bi-file-earmark-excel-fill me-1"></i> Excel Leads
                        </Button>
                      </td>
                    </tr>
                  );
                }
              }) : (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <div className="text-muted mb-2"><i className="bi bi-inbox fs-2"></i></div>
                    <span className="text-muted fw-medium">No reporting deliverables available.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
        <div className="bg-light border-top pt-2">
          <PaginationControl
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            itemName="deliverables"
          />
        </div>
      </Card>

      <ToastNotification show={toast.show} onClose={() => setToast(t => ({ ...t, show: false }))} message={toast.message} variant={toast.variant} />
    </AppLayout>
  );
}

