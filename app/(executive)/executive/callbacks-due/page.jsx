"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";
import { isoDay, todayIso, formatDay } from "@/lib/executive/dateOnly";
import { PaginationControl } from "@/components/ui/PaginationControl";

export default function ExecutiveCallbacksDuePage() {
  const [rows, setRows] = useState([]);
  const [skippedCampaigns, setSkippedCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const campaignsRes = await api.get("/call/my-campaigns");
      const campaigns = (campaignsRes.data.data || []).filter(
        (c) => c.type === "call" && c.status !== "draft"
      );

      if (campaigns.length === 0) {
        setRows([]);
        setSkippedCampaigns([]);
        return;
      }

      const results = await Promise.allSettled(
        campaigns.map((c) => api.get(`/call/campaigns/${c.id}/callbacks-due`))
      );

      const merged = [];
      const skipped = [];
      results.forEach((result, i) => {
        const campaign = campaigns[i];
        if (result.status === "fulfilled") {
          (result.value.data.data || []).forEach((cb) => {
            merged.push({
              ...cb,
              campaignId: campaign.id,
              campaignName: campaign.name,
              campaignStatus: campaign.status
            });
          });
        } else {
          skipped.push({ campaignName: campaign.name, reason: getApiErrorMessage(result.reason) });
        }
      });

      const today = todayIso();
      merged.forEach((cb) => {
        const day = isoDay(cb.followUpDate);
        cb.day = day;
        cb.overdue = day < today;
        cb.dueToday = day === today;
      });
      merged.sort((a, b) => a.day.localeCompare(b.day));

      setRows(merged);
      setSkippedCampaigns(skipped);

      if (skipped.length > 0 && merged.length === 0 && skipped.length === campaigns.length) {
        setError("Couldn't load callbacks for any of your campaigns. Please try again.");
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load your callbacks."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  const overdueCount = useMemo(() => rows.filter((r) => r.overdue).length, [rows]);
  const dueTodayCount = useMemo(() => rows.filter((r) => r.dueToday).length, [rows]);

  const paginatedList = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) {
    return (
      <AppLayout role="executive">
        <PageHeader title="Callbacks Due" subtitle="Promises you've made, due today or overdue, across every campaign." />
        <LoadingSpinner />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout role="executive">
        <PageHeader title="Callbacks Due" subtitle="Promises you've made, due today or overdue, across every campaign." />
        <AlertMessage message={error} />
        <Button variant="primary" className="rounded-pill px-4" onClick={load}>
          Try Again
        </Button>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="executive">
      <PageHeader title="Callbacks Due" subtitle="Promises you've made, due today or overdue, across every campaign." />

      {skippedCampaigns.length > 0 && (
        <AlertMessage
          variant="warning"
          message={`Couldn't check ${skippedCampaigns.length} campaign${skippedCampaigns.length > 1 ? "s" : ""} (${skippedCampaigns.map((s) => s.campaignName).join(", ")}) — their client account may be deactivated.`}
        />
      )}

      <Row className="g-3 mb-4">
        <Col xs={6} md={4}>
          <Card className={`border-0 shadow-sm rounded-4 text-center py-3 ${overdueCount > 0 ? "bg-danger bg-opacity-10" : ""}`}>
            <div className={`small fw-bold text-uppercase mb-1 ${overdueCount > 0 ? "text-danger" : "text-secondary"}`}>Overdue</div>
            <div className={`fs-2 fw-bolder ${overdueCount > 0 ? "text-danger" : "text-dark"}`}>{overdueCount}</div>
          </Card>
        </Col>
        <Col xs={6} md={4}>
          <Card className="border-0 shadow-sm rounded-4 text-center py-3">
            <div className="text-secondary small fw-bold text-uppercase mb-1">Due Today</div>
            <div className="fs-2 fw-bolder text-warning">{dueTodayCount}</div>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="border-0 shadow-sm rounded-4 text-center py-3">
            <div className="text-secondary small fw-bold text-uppercase mb-1">Total Due</div>
            <div className="fs-2 fw-bolder text-primary">{rows.length}</div>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        {rows.length === 0 ? (
          <Card.Body className="text-center py-5 text-muted">
            <i className="bi bi-check-circle fs-1 d-block mb-3 text-success"></i>
            <div className="fw-bold">No callbacks due right now.</div>
            <div className="small">Every promise you've made is either resolved or still in the future.</div>
          </Card.Body>
        ) : (
          <>
            <Table responsive hover className="mb-0 align-middle">
              <thead style={{ background: "#f8f9fa" }}>
                <tr className="text-secondary small text-uppercase">
                  <th className="border-0 ps-4">Lead</th>
                  <th className="border-0">Campaign</th>
                  <th className="border-0">Company</th>
                  <th className="border-0">Phone</th>
                  <th className="border-0">Due</th>
                  <th className="border-0">Notes from Last Call</th>
                  <th className="border-0 pe-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.map((cb) => {
                  const campaignActive = cb.campaignStatus === "active";
                  const callLink = `/executive/campaigns/${cb.campaignId}/dialer?leadId=${cb.campaignLeadId}`;
                  return (
                    <tr key={cb.campaignLeadId} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td className="ps-4">
                        <div className="fw-bold text-dark">{cb.leadName}</div>
                      </td>
                      <td>
                        <Link href={`/executive/campaigns/${cb.campaignId}`} className="text-decoration-none fw-medium">
                          {cb.campaignName}
                        </Link>
                      </td>
                      <td className="text-muted fw-medium">{cb.company || "—"}</td>
                      <td>
                        {cb.phone ? (
                          <a href={`tel:${cb.phone}`} className="text-decoration-none text-dark fw-medium">
                            <i className="bi bi-telephone me-1 text-primary"></i>{cb.phone}
                          </a>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <div className={`fw-bold ${cb.overdue ? "text-danger" : "text-warning"}`}>
                          {formatDay(cb.day)}
                        </div>
                        {cb.overdue ? (
                          <span className="badge bg-danger rounded-pill small">OVERDUE</span>
                        ) : (
                          <span className="badge bg-warning text-dark rounded-pill small">DUE TODAY</span>
                        )}
                      </td>
                      <td className="text-muted small" style={{ maxWidth: "220px" }}>
                        <span className="text-truncate d-block">{cb.notes || "No notes"}</span>
                      </td>
                      <td className="pe-4 text-end">
                        {campaignActive ? (
                          <Link href={callLink} className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold">
                            <i className="bi bi-telephone me-1"></i>Call Now
                          </Link>
                        ) : (
                          <OverlayTrigger
                            placement="left"
                            overlay={
                              <Tooltip>
                                This campaign is {cb.campaignStatus} — it must be active again before you can call.
                              </Tooltip>
                            }
                          >
                            <span className="d-inline-block">
                              <Button variant="outline-secondary" size="sm" className="rounded-pill px-3 fw-bold" disabled style={{ pointerEvents: "none" }}>
                                <i className="bi bi-telephone me-1"></i>Call Now
                              </Button>
                            </span>
                          </OverlayTrigger>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <PaginationControl
              currentPage={currentPage}
              totalPages={Math.max(1, Math.ceil(rows.length / pageSize))}
              totalItems={rows.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemName="callbacks"
            />
          </>
        )}
      </Card>
    </AppLayout>
  );
}
