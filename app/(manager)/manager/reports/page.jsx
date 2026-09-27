"use client";
import React from "react";

import { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Collapse from "react-bootstrap/Collapse";
import Badge from "react-bootstrap/Badge";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import api from "@/lib/api/axios";
import { ToastNotification } from "@/components/ui/ToastNotification";
import { PaginationControl } from "@/components/ui/PaginationControl";

export default function ReportsPage() {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  
  const [sequences, setSequences] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", variant: "danger" });
  
  const [expandedRows, setExpandedRows] = useState({});

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const res = await api.get("/clients");
        setClients(res.data.data);
      } catch (err) {
        setError("Failed to load clients.");
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    setPage(1);
    setExpandedRows({});
    if (!selectedClientId) {
      setSequences([]);
      setCampaigns([]);
      return;
    }
    const loadClientData = async () => {
      try {
        const [seqRes, campRes] = await Promise.all([
          api.get(`/sequences?clientId=${selectedClientId}`),
          api.get(`/campaigns?clientId=${selectedClientId}`)
        ]);
        setSequences(seqRes.data.data);
        // Only show non-draft campaigns for reporting
        setCampaigns(campRes.data.data.filter(c => c.status !== 'draft'));
      } catch (err) {
        console.error(err);
      }
    };
    loadClientData();
  }, [selectedClientId]);

  // Unified list mapping
  const unifiedList = [
    ...sequences.map(seq => ({
      itemType: 'sequence',
      ...seq,
      children: campaigns
        .filter(c => c.sequenceId === seq.id)
        .sort((a, b) => (a.sequenceStepOrder || 0) - (b.sequenceStepOrder || 0))
    })),
    ...campaigns.filter(c => !c.sequenceId).map(camp => ({
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

  const downloadReport = async (url, filename, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setToast({ show: true, message: "Failed to download report.", variant: "danger" });
    }
  };

  return (
    <AppLayout role="manager">
      <PageHeader title="Reports & Exports" subtitle="Download deliverables for your clients." />

      {error && <AlertMessage message={error} />}

      <Card className="border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
        <div style={{ height: "4px", background: "linear-gradient(90deg, #0d6efd, #0dcaf0)" }} />
        <Card.Body className="p-4">
          <Form.Group>
            <Form.Label className="fw-bold text-dark mb-2">
              <i className="bi bi-building me-2 text-primary"></i> Select Client to View Deliverables
            </Form.Label>
            <Form.Select 
              value={selectedClientId} 
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="border-primary shadow-sm"
              style={{ maxWidth: "400px", borderRadius: "8px" }}
            >
              <option value="">-- Choose a Client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Card.Body>
      </Card>

      {selectedClientId && (
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <Card.Header className="bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center text-success" style={{ width: 42, height: 42 }}>
                <i className="bi bi-file-earmark-bar-graph fs-5"></i>
              </div>
              <div>
                <h5 className="fw-bold text-dark mb-0">Client Reporting Data</h5>
                <span className="text-muted small">Sequences and standalone campaigns available for export</span>
              </div>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light text-muted small text-uppercase" style={{ fontSize: "0.8rem", letterSpacing: "0.5px" }}>
                <tr>
                  <th className="py-3 ps-4" style={{ width: '40%' }}>Name / Item</th>
                  <th className="py-3 text-center">Type / Model</th>
                  <th className="py-3 text-center">Status / Details</th>
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
                                <span className="text-muted small">Sequence ({item.children.length} campaigns)</span>
                              </div>
                            </div>
                          </td>
                          <td className="text-center text-muted fw-medium text-capitalize">
                            {item.pricingModel.replace('_', ' ')}
                          </td>
                          <td className="text-center">
                            <Badge bg="secondary" className="px-2 py-1 rounded-pill fw-medium">
                              {item.status || "ACTIVE"}
                            </Badge>
                          </td>
                          <td className="text-end pe-4">
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              className="rounded-pill px-3 py-1 fw-medium shadow-sm me-2"
                              onClick={(e) => downloadReport(`/reports/sequences/${item.id}/pdf`, `Sequence_Report_${item.name.replace(/\s+/g, '_')}.pdf`, e)}
                            >
                              <i className="bi bi-file-pdf-fill me-1"></i> PDF
                            </Button>
                            <Button 
                              variant="outline-success" 
                              size="sm" 
                              className="rounded-pill px-3 py-1 fw-medium shadow-sm"
                              onClick={(e) => downloadReport(`/reports/sequences/${item.id}/excel`, `Sequence_Report_${item.name.replace(/\s+/g, '_')}.xlsx`, e)}
                            >
                              <i className="bi bi-file-earmark-excel-fill me-1"></i> Excel
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
                                  <span className="text-muted small">Campaign</span>
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
                            <td className="text-end pe-4">
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                className="rounded-pill px-3 py-1 fw-medium me-2"
                                onClick={(e) => downloadReport(`/reports/campaigns/${child.id}/pdf`, `Campaign_Report_${child.name.replace(/\s+/g, '_')}.pdf`, e)}
                              >
                                PDF
                              </Button>
                              <Button 
                                variant="outline-success" 
                                size="sm" 
                                className="rounded-pill px-3 py-1 fw-medium"
                                onClick={(e) => downloadReport(`/reports/campaigns/${child.id}/excel`, `Campaign_Leads_${child.name.replace(/\s+/g, '_')}.xlsx`, e)}
                              >
                                Excel
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
                        <td className="text-end pe-4">
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="rounded-pill px-3 py-1 fw-medium shadow-sm me-2"
                            onClick={(e) => downloadReport(`/reports/campaigns/${item.id}/pdf`, `Campaign_Report_${item.name.replace(/\s+/g, '_')}.pdf`, e)}
                          >
                            <i className="bi bi-file-pdf-fill me-1"></i> PDF
                          </Button>
                          <Button 
                            variant="outline-success" 
                            size="sm" 
                            className="rounded-pill px-3 py-1 fw-medium shadow-sm"
                            onClick={(e) => downloadReport(`/reports/campaigns/${item.id}/excel`, `Campaign_Leads_${item.name.replace(/\s+/g, '_')}.xlsx`, e)}
                          >
                            <i className="bi bi-file-earmark-excel-fill me-1"></i> Excel
                          </Button>
                        </td>
                      </tr>
                    );
                  }
                }) : (
                  <tr>
                    <td colSpan="4" className="text-center py-5">
                      <div className="text-muted mb-2"><i className="bi bi-inbox fs-2"></i></div>
                      <span className="text-muted fw-medium">No reporting deliverables available for this client.</span>
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
              itemName="items"
            />
          </div>
        </Card>
      )}

      <ToastNotification show={toast.show} onClose={() => setToast(t => ({ ...t, show: false }))} message={toast.message} variant={toast.variant} />
    </AppLayout>
  );
}
