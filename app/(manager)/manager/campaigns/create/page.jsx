"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import AlertMessage from "@/components/ui/AlertMessage";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

function CampaignWizardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const querySequenceId  = searchParams.get("sequenceId")  || "";
  const queryClientId    = searchParams.get("clientId")    || "";
  const queryLeadListId  = searchParams.get("leadListId")  || "";

  const [clients,   setClients]   = useState([]);
  const [leadLists, setLeadLists] = useState([]);
  const [sequences, setSequences] = useState([]);

  // Sibling campaigns in the same cadence (for step-order suggestion)
  const [cadenceSiblings, setCadenceSiblings] = useState([]);

  const [formError,    setFormError]    = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    clientId:         queryClientId,
    leadListId:       queryLeadListId,
    sequenceId:       querySequenceId,
    sequenceStepOrder: "",  // will be auto-suggested when sequenceId is known
    name:             "",
    type:             "email",
    description:      "",
    pricingModel:     "cost_per_lead",
    ratePerLead:      "",
    retainerAmount:   "",
  });

  // ── Initial data load ───────────────────────────────────────────────────────
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [clientsRes, seqRes] = await Promise.all([
          api.get("/clients"),
          api.get("/sequences")
        ]);
        setClients(clientsRes.data.data);
        setSequences(seqRes.data.data);
      } catch (err) {
        setFormError("Failed to load initial form data.");
      }
    };
    loadInitial();
  }, []);

  // ── Load lead lists when client changes ────────────────────────────────────
  useEffect(() => {
    if (!formData.clientId) { setLeadLists([]); return; }
    api.get(`/lead-lists?clientId=${formData.clientId}`)
      .then(res => setLeadLists(res.data.data))
      .catch(() => setLeadLists([]));
  }, [formData.clientId]);

  // ── When a cadence (sequenceId) is selected/locked, fetch its existing
  //    steps so we can suggest the next step order number ───────────────────
  useEffect(() => {
    if (!formData.sequenceId) { setCadenceSiblings([]); return; }
    api.get(`/campaigns?sequenceId=${formData.sequenceId}`)
      .then(res => {
        const siblings = res.data.data;
        setCadenceSiblings(siblings);
        // Auto-suggest next available step order
        const maxOrder = siblings.reduce((max, c) => {
          const o = c.sequenceStepOrder;
          return o != null && o > max ? o : max;
        }, 0);
        setFormData(prev => ({ ...prev, sequenceStepOrder: String(maxOrder + 1) }));
      })
      .catch(() => setCadenceSiblings([]));
  }, [formData.sequenceId]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSequenceChange = (e) => {
    const seqId = e.target.value;
    if (seqId) {
      const seq = sequences.find(s => s.id === seqId);
      if (seq) {
        setFormData(prev => ({
          ...prev,
          sequenceId:   seqId,
          clientId:     seq.clientId,
          leadListId:   seq.leadListId || prev.leadListId,
          pricingModel: seq.pricingModel  || prev.pricingModel,
          ratePerLead:  seq.ratePerLead   || "",
          retainerAmount: seq.retainerAmount || "",
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, sequenceId: "", sequenceStepOrder: "" }));
      setCadenceSiblings([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    const payload = { ...formData };
    
    // Clean up empty strings
    if (!payload.sequenceId) {
      delete payload.sequenceId;
      delete payload.sequenceStepOrder;
    } else if (payload.sequenceStepOrder) {
      payload.sequenceStepOrder = parseInt(payload.sequenceStepOrder, 10);
    } else {
      delete payload.sequenceStepOrder;
    }

    if (payload.pricingModel === "cost_per_lead") {
      delete payload.retainerAmount;
      payload.ratePerLead = parseFloat(payload.ratePerLead);
    } else if (payload.pricingModel === "flat_retainer") {
      delete payload.ratePerLead;
      payload.retainerAmount = parseFloat(payload.retainerAmount);
    } else {
      delete payload.ratePerLead;
      delete payload.retainerAmount;
      delete payload.pricingModel;
    }

    if (!payload.description) delete payload.description;

    // Sequence-linked campaigns inherit pricing from the sequence
    if (payload.sequenceId) {
      delete payload.pricingModel;
      delete payload.ratePerLead;
      delete payload.retainerAmount;
    }

    try {
      const res = await api.post("/campaigns", payload);
      router.push(`/manager/campaigns/${res.data.data.id}`);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Failed to create campaign."));
      window.scrollTo({ top: 0, behavior: "smooth" });
      setIsSubmitting(false);
    }
  };

  const isSequenceLocked = !!querySequenceId;
  const linkedSequence = sequences.find(s => s.id === formData.sequenceId);

  return (
    <Card className="border-0 shadow-sm mx-auto" style={{ maxWidth: '800px', borderRadius: '12px' }}>
      <Card.Header className="bg-white border-bottom py-3">
        <h5 className="mb-0 fw-bold text-dark">
          <i className="bi bi-megaphone me-2 text-primary"></i>Campaign Details
        </h5>
      </Card.Header>
      <Card.Body className="p-4 p-md-5">
        {formError && <AlertMessage message={formError} />}
        
        <Form onSubmit={handleSubmit}>
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-medium text-secondary small text-uppercase tracking-wide">Campaign Name</Form.Label>
                <Form.Control 
                  type="text" name="name" value={formData.name} onChange={handleChange}
                  placeholder="e.g. Q3 Follow-up Calls"
                  className="bg-light border-0 px-3 py-2 fw-medium" required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-medium text-secondary small text-uppercase tracking-wide">Type</Form.Label>
                <Form.Select name="type" value={formData.type} onChange={handleChange}
                  className="bg-light border-0 px-3 py-2 fw-medium" required>
                  <option value="email">Email Campaign</option>
                  <option value="call">Call Campaign</option>
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-12">
              <Form.Group>
                <Form.Label className="fw-medium text-secondary small text-uppercase tracking-wide">
                  {formData.type === 'call' ? 'Call Script' : 'Description'}
                </Form.Label>
                <Form.Control 
                  as="textarea" rows={3} name="description" value={formData.description} onChange={handleChange}
                  placeholder={formData.type === 'call' ? 'Enter the call script for executives...' : 'Enter campaign description...'}
                  className="bg-light border-0 px-3 py-2 fw-medium"
                />
              </Form.Group>
            </div>
          </div>

          <hr className="my-5 opacity-25" />
          <h5 className="mb-4 fw-bold text-dark"><i className="bi bi-diagram-3 me-2 text-primary"></i>Targeting & Linkage</h5>

          {/* Cadence Link */}
          <div className="p-4 bg-primary bg-opacity-10 rounded-4 border border-primary border-opacity-25 mb-4">
            <Form.Group className="mb-0">
              <Form.Label className="fw-bold text-primary mb-2">Link to Cadence (Optional)</Form.Label>
              <Form.Select
                name="sequenceId" value={formData.sequenceId}
                onChange={handleSequenceChange}
                disabled={isSequenceLocked}
                className="shadow-sm border-0"
              >
                <option value="">-- Standalone Campaign (No Cadence) --</option>
                {sequences.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.stepCount} step{s.stepCount !== 1 ? "s" : ""})
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-primary opacity-75 fw-medium small">
                <i className="bi bi-info-circle me-1"></i>
                Linking to a cadence automatically locks the Client and Lead List.
              </Form.Text>
            </Form.Group>
          </div>

          {/* Step Order — auto-assigned when linked to a cadence */}
          {formData.sequenceId && (
            <div className="p-3 bg-light rounded-3 border mb-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <Form.Label className="fw-bold text-dark mb-1 d-block">
                    <i className="bi bi-list-ol me-2 text-primary"></i>Position in Cadence Sequence
                  </Form.Label>
                  <Form.Text className="text-muted d-block">
                    Automatically assigned step position based on cadence workflow order.
                    {cadenceSiblings.length > 0 && (
                      <> Current steps: {cadenceSiblings.map((c, i) => (
                        <span key={c.id} className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill ms-1 px-2">
                          #{c.sequenceStepOrder ?? i + 1} {c.name}
                        </span>
                      ))}</>
                    )}
                  </Form.Text>
                </div>
                <div>
                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 rounded-pill fw-bold fs-6">
                    Step #{formData.sequenceStepOrder || 1} (Auto-assigned)
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="row g-4">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-medium text-secondary small text-uppercase tracking-wide">Client</Form.Label>
                <Form.Select
                  name="clientId" value={formData.clientId} onChange={handleChange}
                  className="bg-light border-0 px-3 py-2 fw-medium" required
                  disabled={!!formData.sequenceId}
                >
                  <option value="">-- Select Client --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-medium text-secondary small text-uppercase tracking-wide">Target Lead List</Form.Label>
                <Form.Select
                  name="leadListId" value={formData.leadListId} onChange={handleChange}
                  className="bg-light border-0 px-3 py-2 fw-medium" required
                  disabled={!!formData.sequenceId && !!formData.leadListId}
                >
                  <option value="">-- Select List --</option>
                  {leadLists.filter(l => l.status === 'active').map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          {/* Standalone pricing — only when not in a cadence */}
          {!formData.sequenceId && (
            <>
              <hr className="my-5 opacity-25" />
              <h5 className="mb-4 fw-bold text-dark"><i className="bi bi-tag me-2 text-primary"></i>Standalone Pricing</h5>
              <div className="row g-4">
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label className="fw-medium text-secondary small text-uppercase tracking-wide">Pricing Model</Form.Label>
                    <Form.Select name="pricingModel" value={formData.pricingModel} onChange={handleChange}
                      className="bg-light border-0 px-3 py-2 fw-medium">
                      <option value="cost_per_lead">Cost Per Lead (CPL)</option>
                      <option value="flat_retainer">Flat Retainer</option>
                      <option value="unpriced">Unpriced (Internal)</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  {formData.pricingModel === "cost_per_lead" && (
                    <Form.Group>
                      <Form.Label className="fw-medium text-secondary small text-uppercase tracking-wide">Rate Per Lead ($)</Form.Label>
                      <Form.Control
                        type="number" step="0.01" min="0" name="ratePerLead"
                        value={formData.ratePerLead} onChange={handleChange}
                        className="bg-light border-0 px-3 py-2 fw-bold text-success"
                        placeholder="0.00" required
                      />
                    </Form.Group>
                  )}
                  {formData.pricingModel === "flat_retainer" && (
                    <Form.Group>
                      <Form.Label className="fw-medium text-secondary small text-uppercase tracking-wide">Retainer Amount ($)</Form.Label>
                      <Form.Control
                        type="number" step="0.01" min="0" name="retainerAmount"
                        value={formData.retainerAmount} onChange={handleChange}
                        className="bg-light border-0 px-3 py-2 fw-bold text-success"
                        placeholder="0.00" required
                      />
                    </Form.Group>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="mt-5 text-end border-top pt-4">
            <Button variant="light" onClick={() => router.back()}
              className="me-3 px-4 fw-medium text-secondary rounded-pill shadow-sm" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit"
              className="px-4 fw-bold rounded-pill shadow-sm" disabled={isSubmitting}>
              {isSubmitting
                ? <><Spinner animation="border" size="sm" className="me-2" />Creating…</>
                : <><i className="bi bi-check-lg me-1"></i>Create Draft Campaign</>
              }
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default function CreateCampaignPage() {
  return (
    <AppLayout role="manager">
      <PageHeader title="Create Campaign" subtitle="Initialize a new outreach step for a cadence or a standalone campaign." />
      <Suspense fallback={<LoadingSpinner />}>
        <CampaignWizardForm />
      </Suspense>
    </AppLayout>
  );
}
