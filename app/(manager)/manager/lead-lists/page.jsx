"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Card from "react-bootstrap/Card";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import ProgressBar from "react-bootstrap/ProgressBar";
import Spinner from "react-bootstrap/Spinner";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

export default function LeadListsPage() {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [leadLists, setLeadLists] = useState([]);
  
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingLists, setLoadingLists] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadMode, setUploadMode] = useState("new"); // "new" or "existing"
  
  const [formData, setFormData] = useState({
    clientId: "",
    leadListName: "",
    leadListId: "",
  });
  const [file, setFile] = useState(null);

  // Polling state
  const [pollingJobId, setPollingJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null); // { status, processedRows, totalRows, errorCount }
  const pollIntervalRef = useRef(null);

  // Import Job History state
  const [historyJobs, setHistoryJobs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotalJobs, setHistoryTotalJobs] = useState(0);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const fetchImportHistory = async (clientId, page = 1) => {
    if (!clientId) return;
    setHistoryLoading(true);
    try {
      const res = await api.get(`/leads/imports?clientId=${clientId}&page=${page}&pageSize=5`);
      setHistoryJobs(res.data.data || []);
      if (res.data.pagination) {
        setHistoryPage(res.data.pagination.page);
        setHistoryTotalPages(res.data.pagination.totalPages);
        setHistoryTotalJobs(res.data.pagination.total);
      }
    } catch (err) {
      console.error("Failed to load import history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadClients = async () => {
      try {
        const res = await api.get("/clients");
        if (mounted) {
          setClients(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedClientId(res.data.data[0].id);
          }
        }
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, "Failed to load clients."));
      } finally {
        if (mounted) setLoadingClients(false);
      }
    };
    loadClients();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!selectedClientId) {
      setLeadLists([]);
      setHistoryJobs([]);
      return;
    }
    const loadLists = async () => {
      setLoadingLists(true);
      try {
        const res = await api.get(`/lead-lists?clientId=${selectedClientId}`);
        if (mounted) setLeadLists(res.data.data);
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, "Failed to load lead lists."));
      } finally {
        if (mounted) setLoadingLists(false);
      }
    };
    loadLists();
    setHistoryPage(1);
    fetchImportHistory(selectedClientId, 1);
    return () => { mounted = false; };
  }, [selectedClientId]);

  // Polling logic
  useEffect(() => {
    if (!pollingJobId) return;

    const poll = async () => {
      try {
        const res = await api.get(`/leads/imports/${pollingJobId}/status`);
        const statusData = res.data.data;
        setJobStatus(statusData);

        if (statusData.status === "completed" || statusData.status === "failed" || statusData.status === "completed_with_errors") {
          clearInterval(pollIntervalRef.current);
          setPollingJobId(null);
          // Refresh lists to show new counts
          if (selectedClientId) {
            const listRes = await api.get(`/lead-lists?clientId=${selectedClientId}`);
            setLeadLists(listRes.data.data);
            fetchImportHistory(selectedClientId, 1);
          }
        }
      } catch (err) {
        clearInterval(pollIntervalRef.current);
        setPollingJobId(null);
        setError("Import polling failed.");
      }
    };

    pollIntervalRef.current = setInterval(poll, 2000);
    return () => clearInterval(pollIntervalRef.current);
  }, [pollingJobId, selectedClientId]);

  const handleShow = () => {
    setFormData({
      clientId: selectedClientId || (clients.length > 0 ? clients[0].id : ""),
      leadListName: "",
      leadListId: leadLists.length > 0 ? leadLists[0].id : "",
    });
    setUploadMode("new");
    setFile(null);
    setFormError("");
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setFormError("Please select a file.");
      return;
    }
    setFormError("");
    setIsSubmitting(true);

    const payload = new FormData();
    payload.append("clientId", formData.clientId);
    payload.append("file", file);

    if (uploadMode === "new") {
      if (!formData.leadListName.trim()) {
        setFormError("Please provide a new list name.");
        setIsSubmitting(false);
        return;
      }
      payload.append("leadListName", formData.leadListName);
    } else {
      if (!formData.leadListId) {
        setFormError("Please select an existing list.");
        setIsSubmitting(false);
        return;
      }
      payload.append("leadListId", formData.leadListId);
    }

    try {
      const res = await api.post("/leads/import", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // 202 Accepted returns { data: { id } }
      if (res.status === 202 && res.data.data?.id) {
        setPollingJobId(res.data.data.id);
        setJobStatus({ status: res.data.data.status || "queued", processedRows: 0, totalRows: 0, errorCount: 0 });
      }
      handleClose();
      // If we uploaded to a different client, switch to it
      if (formData.clientId !== selectedClientId) {
        setSelectedClientId(formData.clientId);
      }
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Failed to start import."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const archiveList = async (listId) => {
    if (!confirm("Are you sure you want to archive this list?")) return;
    try {
      await api.patch(`/lead-lists/${listId}/archive`);
      const res = await api.get(`/lead-lists?clientId=${selectedClientId}`);
      setLeadLists(res.data.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to archive list."));
    }
  };

  return (
    <AppLayout role="manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bolder mb-1 text-dark tracking-tight">Lead Lists</h3>
          <p className="text-secondary small mb-0">Import and manage client lead databases.</p>
        </div>
        <Button variant="primary" onClick={handleShow} disabled={clients.length === 0 || pollingJobId !== null} className="px-4 fw-medium shadow-sm rounded-pill d-flex align-items-center">
          <i className="bi bi-cloud-upload me-2"></i> Import Leads
        </Button>
      </div>

      {error && <AlertMessage message={error} />}

      {/* Active Job Polling UI */}
      {pollingJobId && jobStatus && (
        <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: '12px', background: 'linear-gradient(145deg, #e0f2fe 0%, #ffffff 100%)' }}>
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 text-primary fw-bold d-flex align-items-center">
                <Spinner animation="border" size="sm" className="me-3" />
                Importing Leads...
              </h5>
              <span className="badge bg-primary px-3 py-2 rounded-pill text-uppercase tracking-wide fw-bold">{jobStatus.status}</span>
            </div>
            <ProgressBar 
              animated={jobStatus.status === "processing" || jobStatus.status === "queued" || jobStatus.status === "uploaded"} 
              now={jobStatus.totalRows > 0 ? (jobStatus.processedRows / jobStatus.totalRows) * 100 : 100} 
              style={{ height: '12px', borderRadius: '6px' }}
            />
            <div className="d-flex justify-content-between mt-3 small fw-medium">
              <span className="text-secondary">Processed <strong className="text-dark">{jobStatus.processedRows || 0}</strong> of <strong className="text-dark">{jobStatus.totalRows || "?"}</strong> rows</span>
              {jobStatus.failedRows > 0 && <span className="text-danger fw-bold"><i className="bi bi-exclamation-circle-fill me-1"></i> {jobStatus.failedRows} errors</span>}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Completed Job Results (Sticky until dismissed or new job starts) */}
      {!pollingJobId && jobStatus && (jobStatus.status === "completed" || jobStatus.status === "failed" || jobStatus.status === "completed_with_errors") && (
        <AlertMessage 
          variant={jobStatus.status === "failed" ? "danger" : (jobStatus.status === "completed_with_errors" ? "warning" : "success")}
          onClose={() => setJobStatus(null)}
          message={
            <div className="d-flex gap-3 align-items-start w-100">
              <div className={`text-${jobStatus.status === "failed" ? "danger" : (jobStatus.status === "completed_with_errors" ? "warning" : "success")} mt-1`}>
                <i className={`bi bi-${jobStatus.status === "failed" ? "x-circle-fill" : (jobStatus.status === "completed_with_errors" ? "exclamation-triangle-fill" : "check-circle-fill")} fs-3`}></i>
              </div>
              <div>
                <strong className="d-block fs-5 mb-1">Import {jobStatus.status === "completed" ? "Successful" : (jobStatus.status === "completed_with_errors" ? "Completed with Errors" : "Failed")}</strong>
                <p className="mb-2">Processed {jobStatus.processedRows || 0} rows.</p>
                {(jobStatus.status === "completed" || jobStatus.status === "completed_with_errors") && (
                  <div className="d-flex gap-4 mb-2 small bg-white bg-opacity-50 p-3 rounded-3">
                    <div>
                      <span className="d-block text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>New to Agency</span>
                      <strong className="fs-5">{jobStatus.newToAgency || 0}</strong>
                    </div>
                    <div>
                      <span className="d-block text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>Database Match</span>
                      <strong className="fs-5">{jobStatus.matchedFromAgencyDatabase || 0}</strong>
                    </div>
                    <div>
                      <span className="d-block text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>Skipped (Already Mapped)</span>
                      <strong className="fs-5">{jobStatus.alreadyMappedToClient || 0}</strong>
                    </div>
                  </div>
                )}
                {jobStatus.failedRows > 0 && <span className="text-danger fw-bold d-block mb-2">Encountered {jobStatus.failedRows} errors.</span>}
                {jobStatus.failureReason && <span className="text-danger d-block mb-2">{jobStatus.failureReason}</span>}
                {jobStatus.hasErrorFile && (
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    className="rounded-pill px-3 fw-bold bg-white"
                    onClick={async () => {
                      try {
                        const res = await api.get(`/leads/imports/${jobStatus.id || jobStatus.jobId}/errors`, { responseType: 'blob' });
                        const url = window.URL.createObjectURL(new Blob([res.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `errors-${jobStatus.id || jobStatus.jobId}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(url);
                      } catch (e) {
                        alert("Failed to download error log.");
                      }
                    }}
                  >
                    <i className="bi bi-download me-1"></i> Download Error Log
                  </Button>
                )}
              </div>
            </div>
          }
        />
      )}

      {loadingClients ? (
        <div className="d-flex justify-content-center p-5"><LoadingSpinner /></div>
      ) : clients.length === 0 ? (
        <AlertMessage variant="warning" message="No clients found. Please create a client first." />
      ) : (
        <>
          <Card className="border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <Card.Header className="bg-white border-bottom py-3">
            <Form.Group className="mb-0 d-flex align-items-center">
              <i className="bi bi-person-badge text-primary me-2 fs-5"></i>
              <Form.Label className="fw-semibold mb-0 me-3 text-nowrap text-dark">Select Client:</Form.Label>
              <Form.Select 
                value={selectedClientId} 
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="bg-light border-0 shadow-none fw-medium"
                style={{ maxWidth: "300px", borderRadius: '8px' }}
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Card.Header>
          <Card.Body className="p-0">
            {loadingLists ? (
              <div className="p-5 d-flex justify-content-center"><LoadingSpinner /></div>
            ) : leadLists.length > 0 ? (
              <Table hover responsive className="mb-0 align-middle">
                <thead className="bg-light text-muted">
                  <tr>
                    <th className="px-4 py-3 fw-semibold border-bottom-0">List Name</th>
                    <th className="px-4 py-3 fw-semibold border-bottom-0">Status</th>
                    <th className="px-4 py-3 fw-semibold border-bottom-0 text-center">Lead Count</th>
                    <th className="px-4 py-3 fw-semibold border-bottom-0">Created At</th>
                    <th className="px-4 py-3 fw-semibold border-bottom-0 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leadLists.map((list) => (
                    <tr key={list.id}>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-file-earmark-spreadsheet text-primary me-3 fs-4"></i>
                          <Link href={`/manager/lead-lists/${list.id}`} className="text-decoration-none">
                            <span className="fw-bold text-dark hover-text-primary">{list.name}</span>
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {list.status === 'active' ? (
                          <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill fw-bold text-uppercase tracking-wide" style={{ fontSize: '0.7rem' }}>Active</span>
                        ) : (
                          <span className="badge bg-secondary bg-opacity-10 text-secondary px-3 py-2 rounded-pill fw-bold text-uppercase tracking-wide" style={{ fontSize: '0.7rem' }}>Archived</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-bold fs-6">
                          {list.leadCount || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-secondary fw-medium">{new Date(list.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-end">
                        {list.status === 'active' && (
                          <Button variant="light" size="sm" className="text-danger fw-bold rounded-pill px-3 shadow-sm" onClick={() => archiveList(list.id)}>
                            <i className="bi bi-archive me-1"></i> Archive
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="text-center text-muted py-5">
                <i className="bi bi-folder-x fs-1 d-block mb-3 opacity-25"></i>
                No lead lists found for this client. Import leads to create one.
              </div>
            )}
          </Card.Body>
        </Card>

        {/* IMPORT JOB HISTORY (COLLAPSIBLE) */}
        <Card className="border-0 shadow-sm mt-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <Card.Header 
            className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center"
            style={{ cursor: 'pointer' }}
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          >
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-clock-history text-primary fs-5"></i>
              <h5 className="fw-bold mb-0 text-dark">Import Job History</h5>
              {clients.find(c => c.id === selectedClientId) && (
                <span className="badge bg-light text-secondary border px-3 py-1 rounded-pill small fw-medium ms-2">
                  Client: {clients.find(c => c.id === selectedClientId)?.name}
                </span>
              )}
              {historyTotalJobs > 0 && (
                <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2 py-1 small fw-bold">
                  {historyTotalJobs} {historyTotalJobs === 1 ? 'job' : 'jobs'}
                </span>
              )}
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small fw-medium">{isHistoryExpanded ? 'Collapse' : 'Expand'}</span>
              <Button variant="light" size="sm" className="rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                <i className={`bi bi-chevron-${isHistoryExpanded ? 'up' : 'down'} fs-6`}></i>
              </Button>
            </div>
          </Card.Header>

          {isHistoryExpanded && (
            <Card.Body className="p-0">
              {historyLoading ? (
                <div className="p-5 d-flex justify-content-center"><LoadingSpinner /></div>
              ) : historyJobs.length > 0 ? (
                <>
                  <Table hover responsive className="mb-0 align-middle">
                    <thead className="bg-light text-muted">
                      <tr>
                        <th className="px-4 py-3 fw-semibold border-bottom-0">Date & Time</th>
                        <th className="px-4 py-3 fw-semibold border-bottom-0">Target List</th>
                        <th className="px-4 py-3 fw-semibold border-bottom-0">File</th>
                        <th className="px-4 py-3 fw-semibold border-bottom-0">Status</th>
                        <th className="px-4 py-3 fw-semibold border-bottom-0 text-center">Rows Breakdown</th>
                        <th className="px-4 py-3 fw-semibold border-bottom-0 text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyJobs.map((job) => {
                        const formattedDate = job.createdAt ? new Date(job.createdAt).toLocaleString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        }) : 'N/A';
                        
                        const statusVariant = 
                          job.status === 'completed' ? 'success' :
                          job.status === 'completed_with_errors' ? 'warning' :
                          job.status === 'failed' ? 'danger' : 'info';

                        return (
                          <tr key={job.id}>
                            <td className="px-4 py-3 text-dark fw-medium small">
                              <i className="bi bi-calendar-event me-2 text-secondary"></i>
                              {formattedDate}
                            </td>
                            <td className="px-4 py-3 fw-bold text-dark">
                              {job.leadListName || "N/A"}
                            </td>
                            <td className="px-4 py-3 text-secondary small">
                              <code>{job.originalFilename}</code>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`badge bg-${statusVariant} bg-opacity-10 text-${statusVariant} px-3 py-2 rounded-pill fw-bold text-uppercase`} style={{ fontSize: '0.65rem' }}>
                                {job.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center small">
                              <div>Processed: <strong>{job.processedRows || 0}</strong> / Total: <strong>{job.totalRows || 0}</strong></div>
                              {(job.newToAgency > 0 || job.matchedFromAgencyDatabase > 0 || job.alreadyMappedToClient > 0) && (
                                <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                                  {job.newToAgency > 0 && <span className="badge bg-success bg-opacity-10 text-success me-1">+{job.newToAgency} New</span>}
                                  {job.matchedFromAgencyDatabase > 0 && <span className="badge bg-primary bg-opacity-10 text-primary me-1">{job.matchedFromAgencyDatabase} Matched</span>}
                                  {job.alreadyMappedToClient > 0 && <span className="badge bg-secondary bg-opacity-10 text-secondary">{job.alreadyMappedToClient} Skipped</span>}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-end">
                              {job.hasErrorFile ? (
                                <Button 
                                  variant="outline-danger" 
                                  size="sm" 
                                  className="rounded-pill px-3 shadow-sm fw-semibold"
                                  onClick={async () => {
                                    try {
                                      const res = await api.get(`/leads/imports/${job.id}/errors`, { responseType: 'blob' });
                                      const url = window.URL.createObjectURL(new Blob([res.data]));
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.setAttribute('download', `import_errors_${job.id.substring(0, 8)}.csv`);
                                      document.body.appendChild(link);
                                      link.click();
                                      link.remove();
                                      window.URL.revokeObjectURL(url);
                                    } catch (e) {
                                      alert("Failed to download error log.");
                                    }
                                  }}
                                >
                                  <i className="bi bi-download me-1"></i> Error Log
                                </Button>
                              ) : (
                                <span className="text-muted small">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>

                  {/* PAGINATION CONTROLS */}
                  {historyTotalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
                      <span className="small text-muted">
                        Page <strong>{historyPage}</strong> of <strong>{historyTotalPages}</strong> ({historyTotalJobs} total jobs)
                      </span>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          className="rounded-pill px-3"
                          disabled={historyPage <= 1 || historyLoading}
                          onClick={() => {
                            const prev = historyPage - 1;
                            setHistoryPage(prev);
                            fetchImportHistory(selectedClientId, prev);
                          }}
                        >
                          <i className="bi bi-chevron-left me-1"></i> Previous
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          className="rounded-pill px-3"
                          disabled={historyPage >= historyTotalPages || historyLoading}
                          onClick={() => {
                            const next = historyPage + 1;
                            setHistoryPage(next);
                            fetchImportHistory(selectedClientId, next);
                          }}
                        >
                          Next <i className="bi bi-chevron-right ms-1"></i>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-inbox fs-2 d-block mb-2 opacity-35"></i>
                  No import history found for this client.
                </div>
              )}
            </Card.Body>
          )}
        </Card>
        </>
      )}

      <Modal show={showModal} onHide={handleClose} backdrop="static">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>Import Leads</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formError && <AlertMessage message={formError} />}
            
            <Form.Group className="mb-3">
              <Form.Label>Client</Form.Label>
              <Form.Select 
                name="clientId" 
                value={formData.clientId} 
                onChange={handleChange}
                required
              >
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>List Destination</Form.Label>
              <div>
                <Form.Check 
                  inline
                  type="radio" 
                  label="Create New List" 
                  name="uploadMode" 
                  id="modeNew"
                  checked={uploadMode === "new"}
                  onChange={() => setUploadMode("new")}
                />
                <Form.Check 
                  inline
                  type="radio" 
                  label="Append to Existing List" 
                  name="uploadMode" 
                  id="modeExisting"
                  checked={uploadMode === "existing"}
                  onChange={() => setUploadMode("existing")}
                  disabled={leadLists.length === 0}
                />
              </div>
            </Form.Group>

            {uploadMode === "new" ? (
              <Form.Group className="mb-3">
                <Form.Label>New List Name</Form.Label>
                <Form.Control 
                  type="text" 
                  name="leadListName" 
                  value={formData.leadListName} 
                  onChange={handleChange}
                  placeholder="e.g. Q3 Prospects"
                  required
                />
              </Form.Group>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label>Select Existing List</Form.Label>
                <Form.Select 
                  name="leadListId" 
                  value={formData.leadListId} 
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select List --</option>
                  {leadLists.filter(l => l.status === 'active').map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>CSV / XLSX File</Form.Label>
              <Form.Control 
                type="file" 
                accept=".csv,.xlsx" 
                onChange={handleFileChange}
                required
              />
              <Form.Text className="text-muted">
                Headers must be exactly: <code>first_name, last_name, email, phone, company, job_title, industry, source</code>
              </Form.Text>
            </Form.Group>

          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Uploading..." : "Start Import"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </AppLayout>
  );
}
