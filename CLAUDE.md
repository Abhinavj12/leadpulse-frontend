# LeadPulse Frontend — Build Specification & Working Agreement

You are completing the remaining and improving frontend for **LeadPulse**, a B2B outbound lead-generation platform. The backend is **finished, tested (484 assertions across 12 suites), and frozen**. Your job is the frontend only.

Read this document fully before writing any code. It contains the complete API contract, the business rules that drive every UI decision, and a phased build plan. Do not skip to coding.

## 0. How I want you to work

**This is the most important section. Follow it exactly.**

1. **Work one phase at a time.** After each phase, stop, tell me what you built, and wait for me to say continue. Do not generate all phases in one pass — quality degrades and I cannot review it.
2. **Never invent an endpoint.** Section 3 is the complete API surface. If a screen seems to need data that no endpoint returns, **stop and tell me** — do not guess a URL, do not assume a field exists, do not silently change the backend.
3. **Never modify the backend.** It is a separate, frozen repository. If something is genuinely missing, raise it; I will decide.
4. **Match response shapes exactly.** Every response is `{ success: true, data: <payload> }`. Errors are `{ success: false, code, message }`. Field names in Section 3 are literal — `firstName` not `first_name`, `campaignLeadId` not `leadId`.
5. **Every data-fetching screen needs four states**: loading, error (with the backend's actual `message`, plus a retry), empty, and populated. A screen with only the populated state is incomplete and I will reject it.
6. **Ask before assuming.** If a business rule here is ambiguous for a screen you're building, ask rather than picking one.

**Code quality bar:** simple and reusable over clever. Extract shared UI primitives (button, input, card, table, badge, modal, spinner, empty state, confirm dialog) once and reuse them. No duplicated fetch/loading/error logic in every page — wrap it in one hook.

**Visual bar:** professional, restrained, business software. No emoji, no cartoon icons, no decorative illustrations, no bright playful palettes. Think a muted slate/navy primary, neutral grays, generous whitespace, flat surfaces. This is a tool agency staff use all day.

---

## 1. What LeadPulse is

An agency runs **outbound email and phone campaigns on behalf of multiple client companies**. Three roles use the system:

| Role | Who they are | What they do |
|---|---|---|
| **Campaign Manager** | Agency staff, the primary user | Owns clients, imports leads, builds campaigns and sequences, assigns executives, approves campaigns, confirms conversions, pulls reports |
| **Executive** | Agency staff, works the phones | Sees only campaigns assigned to them; works a one-lead-at-a-time call queue; logs outcomes |
| **Client** | The agency's customer | Read-only portal: sees progress, results, and what they owe — nothing about the agency's internal operations |

**The commercial model matters and shapes the UI:**

- A **campaign** is one channel touch (one email blast, or one calling push).
- A **sequence** is a multi-step motion — e.g. "intro email → follow-up call → thank-you email". **This is what a client actually contracts and pays for.**
- Pricing lives on the **sequence** (or on a standalone campaign with no sequence). A campaign that belongs to a sequence **never shows its own money figure** — it shows a pointer to the sequence. Otherwise a 3-step motion would appear to owe three times.
- Two pricing models: `cost_per_lead` (pay per confirmed conversion) and `flat_retainer` (fixed fee). They are mutually exclusive and **must never be summed together** anywhere in the UI.

---

## 2. Hard constraints

- **Backend base URL:** `http://localhost:4000/api/v1`, configurable via env var. Three services run: API (4000), upload service (4001), email service (4002) — the frontend only ever talks to 4000.
- **Auth model:** access token (JWT, 15-min expiry) held **in memory only** — never `localStorage`, never a JS-readable cookie. Refresh token is an **httpOnly `SameSite=Strict` cookie** the browser handles automatically. All requests must send `withCredentials: true` / `credentials: 'include'` or refresh breaks.
- **Silent refresh is mandatory.** On any `401`, attempt `POST /auth/refresh` exactly once, retry the original request with the new token, and only force a logout if that also fails. Share one in-flight refresh promise so parallel 401s don't fire multiple refreshes.
- **CORS is already configured** for `http://localhost:3000` with credentials. If you change the frontend port, tell me — the backend env var needs updating.
- **Role routing:** read `role` from `GET /auth/me`. Values are exactly `campaign_manager`, `executive`, `client`. Route each to its own section; a wrong-role visitor is redirected to their own home, not shown a 403 page.
- **The real authorization boundary is the API**, which independently authorizes every request. Any client-side guard is a UX convenience only — never treat it as security, and never store anything sensitive in a client-readable cookie.
- **Stack:** match whatever already exists in this repo (see Phase 0). If nothing exists yet, use Next.js 14 App Router + React 18, and Recharts for charts, per the original SRS.

---

## 3. Complete API contract

**83 endpoints. This is all of them. Nothing else exists.**

### Conventions
- Success: `{ "success": true, "data": <payload> }`
- Error: `{ "success": false, "code": "...", "message": "..." }`
- Error codes → HTTP: `VALIDATION_ERROR` 400 · `UNAUTHORIZED` 401 · `FORBIDDEN` 403 · `NOT_FOUND` 404 · `CONFLICT` 409 · `BUSINESS_RULE_ERROR` 422 · `UPSTREAM_SERVICE_ERROR` 503
- **Always surface the backend's `message` verbatim to the user.** It is written to be human-readable. Never replace it with a generic "Something went wrong".
- A `404` on someone else's resource is deliberate (it never confirms the resource exists). Do not present it as a bug.

### 3.1 Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | Manager self-signup only. Body: `firstName, lastName, email, password, confirmPassword`. Optional `recaptchaToken`. |
| POST | `/auth/login` | Body: `email, password`, optional `recaptchaToken`. → `{ user: {...}, accessToken }`. Sets refresh cookie. 5 failed attempts = 15-min lockout. |
| POST | `/auth/refresh` | No body. Reads cookie. → `{ accessToken }` |
| POST | `/auth/logout` | Auth. Revokes refresh token + invalidates all access tokens. |
| POST | `/auth/forgot-password` | Body: `email`. **Always returns the same response** whether the email exists or not — the UI must show one identical confirmation either way (no account enumeration). |
| POST | `/auth/reset-password` | Body: `token, password, confirmPassword`. Token comes from the emailed link `?token=`. |
| GET | `/auth/me` | → `{ id, role, firstName, lastName, email, managerId, clientId }` |
| PATCH | `/auth/change-password` | Any role. Body: `currentPassword, newPassword, confirmNewPassword`. **Invalidates every session including the current one — sign the user out afterward.** |
| PATCH | `/auth/profile` | Any role. Body: `firstName` and/or `lastName` (at least one). |

`recaptchaToken` is optional: the backend runs in stub mode until a real Google key is configured. Omit it for now.

**Password policy (mirror client-side):** min 8 chars, ≥1 uppercase, ≥1 digit, ≥1 special character.

### 3.2 Clients — Manager
| Method | Path | Notes |
|---|---|---|
| POST | `/clients` | Body: `name` (required), `contactPerson?`, `contactEmail?` |
| GET | `/clients` | → array |
| GET | `/clients/:id` | Manager who owns it, or that client's own portal user |
| PATCH | `/clients/:id` | Any subset of the create fields |
| PATCH | `/clients/:id/deactivate` | Freezes new work; history preserved; reads still allowed |
| PATCH | `/clients/:id/reactivate` | |

Shape: `{ id, name, contactPerson, contactEmail, isActive, createdAt }`

### 3.3 Users — Manager
| Method | Path | Notes |
|---|---|---|
| POST | `/users/executives` | Body: `firstName, lastName, email, temporaryPassword?`. **The password is only ever emailed — never returned. Never display one.** |
| GET | `/users/executives` | → `{ ...user, assignedCampaigns: [{id,name,status}], callsLogged, openLeads }` |
| POST | `/users/client-users` | Body: `clientId, firstName, lastName, email, temporaryPassword?`. **This is the only way a Client can ever log in.** |
| GET | `/users/client-users?clientId=` | |
| PATCH | `/users/:id/deactivate` | Logs them out immediately |
| PATCH | `/users/:id/reactivate` | |
| POST | `/users/:id/reset-password` | Emails a reset link; manager never sees the password |

`openLeads` is the count of unresolved leads still assigned to that executive — **surface it prominently in the deactivate confirmation**, because deactivating strands those leads and the manager must reassign them first.

### 3.4 Lead Lists & Import — Manager
| Method | Path | Notes |
|---|---|---|
| POST | `/lead-lists` | Body: `clientId, name`. Reuses an existing same-name list (case-insensitive) rather than duplicating. |
| GET | `/lead-lists?clientId=` | **`clientId` is required.** → `{ id, clientId, name, status, createdAt, leadCount }` |
| GET | `/lead-lists/:id` | |
| PATCH | `/lead-lists/:id/archive` | Retires it from new campaigns; existing campaigns unaffected |
| POST | `/leads/import` | **multipart/form-data.** Fields: `clientId`, `file`, and **either** `leadListName` (new list) **or** `leadListId` (append) — never both. Returns **202 + job id immediately.** |
| GET | `/leads/imports?clientId=` | **`clientId` is required.** |
| GET | `/leads/imports/:jobId/status` | Poll this |
| GET | `/leads/imports/:jobId/errors` | **Authenticated CSV download** |

CSV columns must be exactly: `first_name,last_name,email,phone,company,job_title,industry,source`. Max 10 MB.

Import job shape:
```json
{ "id","clientId","leadListId","leadListName","originalFilename","status",
  "totalRows","processedRows","successfulRows","failedRows","progressPercentage",
  "newToAgency","matchedFromAgencyDatabase","alreadyMappedToClient",
  "hasErrorFile","failureReason","startedAt","finishedAt","createdAt" }
```
`status`: `uploaded` → `queued` → `processing` → `completed` | `completed_with_errors` | `failed`

**Polling rule:** poll every ~2.5s **only while at least one job is non-terminal**, and stop as soon as all are terminal. Never poll forever.

**Download rule:** `/errors` requires a Bearer token. A plain `<a href>` **cannot** send one and will silently 401. Fetch it as a blob through your authenticated client and trigger the download programmatically. The same applies to every report download.

### 3.5 Leads — Manager
| Method | Path | Notes |
|---|---|---|
| GET | `/leads?clientId=&leadListId=&status=&industry=&jobTitle=&source=&page=&pageSize=` | `clientId` required. `status` filters per-list membership status — pair it with `leadListId` for an unambiguous result. `pageSize` max 100. |
| GET | `/leads/:id?clientId=` | Person + their per-list statuses **for this client only** |
| PATCH | `/leads/:id/dnc` | Body: `clientId, dnc` |
| PATCH | `/leads/:id/status` | Body: `leadListId, status`. **The only path that may move status backwards** (manager correcting a mistake). |

### 3.6 Campaigns — Manager
| Method | Path | Notes |
|---|---|---|
| POST | `/campaigns` | See payload below |
| GET | `/campaigns?clientId=&status=&type=` | |
| GET | `/campaigns/:id` | Adds `executives: [{id,firstName,lastName,email}]` and `audienceCount` |
| PATCH | `/campaigns/:id` | **Draft only.** Any subset of editable fields. |
| POST | `/campaigns/:id/executives` | Body: `{ executiveUserIds: [uuid] }` — **multiple allowed** |
| DELETE | `/campaigns/:id/executives/:executiveId` | Soft-closes; returns their pending leads to the pool |
| POST | `/campaigns/:id/reassign-leads` | Body: `{ targetExecutiveId, leadIds: [] }`. Only `pending` leads move. |
| PATCH | `/campaigns/:id/approve` | **Freezes the audience. Irreversible.** |
| PATCH | `/campaigns/:id/pause` | |
| PATCH | `/campaigns/:id/resume` | |
| PATCH | `/campaigns/:id/end` | Terminal |

Create payload:
```json
{
  "clientId": "uuid", "leadListId": "uuid",
  "name": "Q3 Calls", "type": "email" | "call",
  "description": "...", "categoryTag": "...",
  "segmentationFilters": { "industry": "Tech", "jobTitle": "VP", "source": "Web",
                           "membershipStatus": "New|Contacted|Qualified|Converted|Dead" },
  "excludeClosedLeads": true,
  "pricingModel": "cost_per_lead" | "flat_retainer",
  "ratePerLead": 8, "retainerAmount": 1000,
  "sequenceId": "uuid", "sequenceStepOrder": 2,
  "subjectLine": "...", "senderName": "...", "replyToEmail": "...", "emailBodyHtml": "<p>...</p>"
}
```
Rules the UI must respect: pricing fields are **mutually exclusive** (`cost_per_lead` → `ratePerLead` only; `flat_retainer` → `retainerAmount` only; or neither). `sequenceStepOrder` requires `sequenceId`. Email fields only apply to `type: "email"`. **Amounts must be numbers, not strings.**

Campaign shape:
```json
{ "id","clientId","leadListId","sequenceId","sequenceStepOrder","name","type",
  "description","categoryTag","status","dispatchStatus","segmentationFilters",
  "excludeClosedLeads","pricingModel","retainerAmount","ratePerLead",
  "requiresManagerApproval","approvedAt","subjectLine","senderName",
  "replyToEmail","bannerImageUrl","createdAt" }
```
`status`: `draft` | `active` | `paused` | `completed` · `dispatchStatus`: `not_sent` | `sending` | `sent`

⚠️ **`ratePerLead` and `retainerAmount` come back as strings** (e.g. `"8.00"`) from Postgres DECIMAL. Coerce before arithmetic.

### 3.7 Call engine
| Method | Path | Role |
|---|---|---|
| GET | `/call/my-campaigns` | Executive — their assigned **call** campaigns, each with `myPendingLeads` |
| GET | `/call/campaigns/:campaignId/next` | Executive — serve the next Call Card |
| GET | `/call/leads/:campaignLeadId` | Executive — full card for one specific lead, read-only |
| POST | `/call/leads/:campaignLeadId/remarks` | Executive — log an outcome |
| POST | `/call/leads/:campaignLeadId/skip` | Executive — pass without a call happening |
| GET | `/call/campaigns/:campaignId/callbacks-due` | Manager **or** Executive |
| GET | `/call/campaigns/:campaignId/pending-conversions` | Manager |
| PATCH | `/call/remarks/:remarkId/review` | Manager |
| GET | `/call/campaigns/:campaignId/progress` | Manager |

**`/next` response:** `{ success: true, data: <card> | null, queueExhausted: boolean }`

Call Card shape:
```json
{ "campaignLeadId","leadId","firstName","lastName","company","jobTitle",
  "phone","email","industry","queueStatus",
  "previousRemarks": [{ "callOutcome","notes","followUpDate","createdAt" }] }
```

**Remark payload:** `{ callOutcome, callDurationMinutes?, notes?, followUpDate?, leadStatusUpdate? }`

The eight outcomes and what each does:

| Outcome | Result |
|---|---|
| `Answered` | Stays in queue, re-servable later |
| `Not Answered` | Same |
| `Busy` | Same |
| `Left Voicemail` | Same |
| `Callback Requested` | **Requires `followUpDate` (YYYY-MM-DD).** Lead becomes `in_progress` and is **hidden from `/next` until that date arrives.** |
| `Wrong Number` | **Terminal** — removed from queue |
| `Not Interested` | **Terminal** — lead marked `Dead` |
| `Converted` | **Terminal in the queue, but does NOT count yet** — awaits manager confirmation |

`followUpDate` is **required for `Callback Requested` and rejected for every other outcome.** Enforce this in the form.

**Callbacks-due shape:** `[{ campaignLeadId, leadId, leadName, company, phone, followUpDate, notes, overdue }]` — a reduced summary. To act on one, fetch the full card via `GET /call/leads/:campaignLeadId` first.

**Progress shape (Manager):**
```json
{ "queue": { "total","pending","in_progress","called","completed","skipped" },
  "executives": [{ "executiveId","name","callsLogged","averageDurationMinutes",
                   "conversionsClaimed","conversionsConfirmed" }],
  "billing": { ... } }
```

**Review payload:** `{ confirmed: true }` or `{ confirmed: false, rejectionReason: "..." }`. A reason is **required** when rejecting and **rejected** when confirming.

### 3.8 Email engine
| Method | Path | Role |
|---|---|---|
| POST | `/email/campaigns/:campaignId/dispatch` | Manager or assigned Executive — returns 202 + job |
| GET | `/email/dispatches/:jobId` | Poll |
| GET | `/email/campaigns/:campaignId/dispatches` | History, newest first |
| GET | `/email/campaigns/:campaignId/analytics` | Manager |

Dispatch job: `{ id, campaignId, status, totalRecipients, processed, sent, failed, suppressed, progressPercentage, failureReason, startedAt, finishedAt, createdAt }`
`status`: `queued` → `processing` → `completed` | `completed_with_errors` | `failed`

Analytics:
```json
{ "funnel": { "audience","attempted","sent","delivered","opened","clicked","converted" },
  "rates": { "deliveryRate","openRate","clickThroughRate","clickToOpenRate",
             "bounceRate","unsubscribeRate","conversionRate" },
  "alerts": { "highBounceRate": bool, "highUnsubscribeRate": bool },
  "billing": { ... } | null }
```
Rates are already percentages (e.g. `25` = 25%) — **do not multiply by 100.**

`suppressed` = recipients skipped at send time for consent reasons (DNC / unsubscribed / hard-bounced). **Display it as a distinct, explained number — it is not a failure.**

### 3.9 Sequences — Manager
| Method | Path |
|---|---|
| POST | `/sequences` — body: `clientId, leadListId, name, description?, pricingModel?, ratePerLead?/retainerAmount?` |
| GET | `/sequences?clientId=` — adds `stepCount` |
| GET | `/sequences/:id` — full rollup |
| PATCH | `/sequences/:id` |

Rollup shape:
```json
{ "sequence": { "id","name","description","clientId","leadListId","createdAt" },
  "steps": [{ "id","name","type","status","stepOrder" }],
  "totals": { "steps","uniqueLeadsReached","emailsSent","emailsSentToUniqueLeads",
              "callsLogged","uniqueLeadsCalled","convertedLeads" },
  "conversionsByStep": [{ "campaignId","stepOrder","campaignName",
                          "newConversions","engagementEvents" }],
  "billing": { ... } }
```
Match `conversionsByStep` to `steps` by **`campaignId`**, not by index or name.

### 3.10 Reports
| Method | Path |
|---|---|
| GET | `/reports/campaigns/:campaignId/pdf` |
| GET | `/reports/campaigns/:campaignId/excel` |
| GET | `/reports/campaigns/:campaignId` (JSON) |
| GET | `/reports/sequences/:sequenceId/pdf` |
| GET | `/reports/sequences/:sequenceId/excel` |

All authenticated; all **binary blob downloads** (see the download rule in 3.4). Redaction is applied server-side by role — the frontend does no filtering.

### 3.11 Client Portal — Client role only
| Method | Path |
|---|---|
| GET | `/portal/dashboard?leadListId=&sequenceId=` |
| GET | `/portal/campaigns` |
| GET | `/portal/sequences` |
| GET | `/portal/sequences/:id` |
| GET | `/portal/billing` |

Dashboard:
```json
{ "client": { "id","name" },
  "scope": { "leadListId","sequenceId" },
  "totals": { "campaigns","emailCampaigns","callCampaigns","leadsTargeted",
              "emailsSent","emailsSentToUniqueLeads","callsLogged",
              "uniqueLeadsCalled","qualifiedLeads","convertedLeads" } }
```

Billing:
```json
{ "client": {...},
  "costPerLead":  { "items": [{ "sourceType","id","name","ratePerLead",
                                "billableConversions","amountAccrued" }],
                    "subtotalAccrued": 45 },
  "flatRetainer": { "items": [{ "sourceType","id","name","retainerAmount",
                                "billableConversions","costPerConversion" }],
                    "subtotalRetainers": 1000 },
  "unpriced":     { "items": [{ "sourceType","id","name" }] } }
```
**There is deliberately no grand total. Never compute one.** The two subtotals are different kinds of commitment and blending them produces a figure matching no real invoice. Present them as two separate lines.

### 3.12 Manager Dashboard
`GET /manager/dashboard?clientId=`
```json
{ "totals": { "totalCampaigns","activeCampaigns","totalLeadsContacted",
              "avgEmailOpenRate","totalCallsLogged" },
  "recentCampaigns": [{ "id","name","type","status","clientName","createdAt" }],
  "recentImports": [{ "id","filename","clientName","leadListName",
                      "status","progressPercentage","failedRows" }] }
```

### 3.13 Banner upload — Manager
`POST /uploads/banner-url` → presigned PUT URL. Body: `{ campaignId, contentType, fileSize }`. Then the browser PUTs the file bytes directly to the returned URL, and you set the returned `publicUrl` as the campaign's `bannerImageUrl` via `PATCH /campaigns/:id`. Draft + email campaigns only.

### 3.14 Public tracking (no UI needed)
`/track/open`, `/track/click`, `/track/convert`, `/track/unsubscribe`, `/webhooks/sendgrid` are hit by email clients and SendGrid, not by your app. **Build no UI for these.**

---

## 4. Business rules that drive the UI

These are not implementation trivia — they change what you render.

1. **Approval freezes the audience, permanently.** Before approval a campaign has no audience (`audienceCount` is 0 and meaningless). Approval resolves the filters once and writes the frozen list. The confirm dialog must say this is irreversible.

2. **Draft campaigns are editable; approved ones are not.** Only show edit affordances when `status === 'draft'`.

3. **Consent is checked live at send/call time, never frozen.** A lead who unsubscribes after approval is skipped at dispatch and counted as `suppressed`. Explain this where the number appears.

4. **Call conversions require a second pair of eyes.** An executive logging `Converted` does **not** convert the lead or bill anything. It sits as a claim until a manager confirms it. The reporting executive can never be the confirming manager (enforced in the DB). Until confirmation, the client sees the lead as `Qualified`, never `Converted`. **This is the core trust mechanism of the product — the review UI is not optional.**

5. **Email conversions need no confirmation.** The lead clicked the CTA themselves; that can't be faked by the agency.

6. **Billing is per sequence, not per step.** A campaign inside a sequence returns a billing pointer (`billedAtSequenceLevel: true, sequenceId, sequenceName`), not a number. **Render that as a link to the sequence — never as $0.** A standalone campaign bills on its own.

7. **The same lead can be billed again in a different sequence.** Two independent motions reaching the same person are two pieces of delivered value. The client dashboard counts them as **one unique person**, while billing shows **two charges**. Both are correct; don't try to reconcile them in the UI.

8. **The client portal never shows draft work.** A manager's unapproved campaign, or a sequence whose steps are all draft, is invisible to the client. The backend enforces this — don't add client-side filtering on top.

9. **Status moves forward only, automatically.** `New → Contacted → Qualified → Converted`, or `Dead` on an explicit negative. Only the manager's manual override may move it backwards.

10. **Lead identity is three-layered.** One global person record; per-client consent flags; per-list funnel status. The same person can be `Converted` on one client's list and `New` on another, and **neither client ever learns about the other.** Never build a UI that implies a global lead status.

11. **A scheduled callback is a promise.** A lead with a future `followUpDate` is hidden from `/next` until that date. If `/next` returns `queueExhausted: true` but the campaign is still `active`, that means "nothing for you right now", **not** "campaign finished" — word it that way.

12. **Skip ≠ an outcome.** Skip means "not calling this person right now" — no call happened. It writes no call record and doesn't inflate call stats. Keep it visually distinct from the outcome buttons.

---

## 5. The three roles, end to end

### 5.1 Campaign Manager

**Navigation:** Dashboard · Clients · Team · Lead Lists · Campaigns · Sequences · (Profile in the top-right menu)

**Journey:**
1. Registers → lands on Dashboard (all zeros initially).
2. **Creates a client.**
3. **Creates executives** (Team) and **creates a client portal user** (so the client can log in).
4. **Imports leads** (Lead Lists): pick client → upload CSV → watch live progress → download error rows if any.
5. **Builds a campaign** via a 5-step wizard: Basics (name, type, client) → Audience (lead list + segmentation filters + `excludeClosedLeads`) → Assign Executives (multi-select) → Type-specific config (email composition, or nothing for call; plus optional pricing) → Review & Confirm. Saves as **Draft**.
6. **Opens the campaign** → edits while draft → **Approves** (audience freezes) → then:
   - *Email:* Dispatch → watch job progress → view analytics funnel + rates + alerts.
   - *Call:* watch queue progress and per-executive performance.
7. **Reviews pending conversions** — confirm or reject each with a reason.
8. **Checks callbacks due** across their campaigns.
9. **Builds a sequence**, then adds campaigns to it as ordered steps.
10. **Downloads reports** (PDF/Excel) per campaign or per sequence.
11. Pauses / resumes / ends campaigns as needed.

**Screens to build:** Dashboard · Clients list+form · Team list+form · Lead Lists (list + import + history) · Leads browse + lead detail · Campaigns list · Campaign wizard · Campaign detail (both types) · **Conversion review** · **Callbacks due** · Sequences list · Sequence detail · Profile

### 5.2 Executive

**Navigation:** Dashboard · My Campaigns · Call Queue · (Profile)

**Journey:**
1. Logs in with emailed credentials → prompted to change password.
2. **Dashboard:** assigned campaigns, pending leads, calls logged, callbacks due today.
3. **Opens a call campaign → Start Calling.**
4. **The Call Card** — the heart of their day. Shows name, company, job title, phone, email, industry, and **full previous remark history**. Actions:
   - Log an outcome (the 8 above), with duration and notes; `Callback Requested` reveals a required date picker.
   - **Skip** — visually separate, clearly "no call happened".
   - Submit & Next — advances immediately to the next card.
5. **Progress bar** showing pending / in progress / called / completed.
6. When `queueExhausted: true` → "Nothing left in your queue right now" (see rule 11).
7. **Callbacks due** — their own slice; clicking one loads that lead's full card to act on.
8. For assigned **email** campaigns: view stats and trigger dispatch.

**Screens:** Dashboard · My Campaigns · Call Queue (the Call Card) · Callbacks Due · Profile

**Note:** `/call/my-campaigns` returns **call campaigns only**. An executive assigned to an email campaign has no listing endpoint for it — if you need one, tell me rather than inventing it.

### 5.3 Client (read-only)

**Navigation:** Dashboard · Campaigns · Sequences · Billing · (Profile)

**Journey:**
1. Logs in with manager-issued credentials → own dashboard.
2. **Dashboard:** total campaigns, unique leads reached, emails sent, calls made, qualified, converted. Optional scoping by lead list or sequence. Monthly volume chart.
3. **Campaigns:** history table, read-only detail, report downloads.
4. **Sequences:** each motion with its steps, deduplicated totals, and **one** billing figure.
5. **Billing:** the statement — cost-per-lead items and retainer items as **two separate groups with two separate subtotals**.

**Everything is read-only.** No create/edit/delete affordances anywhere. No internal call notes are ever shown. Lead identities appear only for `Qualified`/`Converted` leads — and that redaction is done server-side, so just render what you receive.

---

## 6. Build plan — one phase at a time

**Stop after each phase and report. Do not run ahead.**

### Phase 0 — Audit (no new features)
Inventory what already exists in this repo: framework and version, folder structure, styling approach, existing API client, existing auth handling, which screens exist and their real state. **Report back before writing anything.** Flag anything that conflicts with Section 2 (especially token storage and refresh handling). I'll decide what to keep vs. replace.

### Phase 1 — Foundation
API client with token injection + single-flight silent refresh · auth context (login/logout/silent resume on reload) · role-based routing and guards · shared UI primitives · the data-fetching hook with loading/error/empty handling · app shell (sidebar + topbar).
**Done when:** I can log in as a manager, land on a role-correct empty dashboard, hard-refresh without being logged out, and log out cleanly.

### Phase 2 — Manager: foundations
Dashboard · Clients · Team (executives **and** client portal users) · Profile.
**Done when:** I can create a client, an executive, and a client portal user — and that client user can actually log in.

### Phase 3 — Manager: leads
Lead Lists · import flow with live polling · authenticated error-CSV download · leads browse with filters · lead detail (engagement + call history).
**Done when:** I can import a CSV with a deliberately bad row, watch it progress, download the errors, and browse the imported leads.

### Phase 4 — Manager: campaigns
Campaign list with filters · 5-step wizard · campaign detail for **both** types (draft edit, approve/pause/resume/end, email composition + dispatch + analytics, call progress) · **billing display** (respecting rule 6) · report downloads.
**Done when:** I can create, approve, and dispatch an email campaign, and separately create and approve a call campaign and see its progress.

### Phase 5 — Manager: the trust loop ⚠️ *highest business value*
**Conversion review** (pending-conversions inbox, confirm/reject with required reason) · **Callbacks due** · lead reassignment between executives.
**Done when:** an executive can claim a conversion and I can confirm it, and the lead's status and billing update accordingly.

### Phase 6 — Manager: sequences
Sequences list · create · detail rollup (steps, totals, `newConversions` vs `engagementEvents`, billing) · "Add Step" that launches the campaign wizard **pre-filled and locked** to the sequence's client and lead list.
**Done when:** I can build a two-step sequence and see one combined billing figure, not two.

### Phase 7 — Executive
Dashboard · My Campaigns · **Call Queue / Call Card** (the most important screen in this phase — get the interaction tight) · Skip · Callbacks Due · Profile.
**Done when:** an executive can work a full queue end to end, including a callback that correctly disappears until its date.

### Phase 8 — Client portal
Dashboard with scoping + chart · Campaigns · Sequences · **Billing statement** · Profile.
**Done when:** a client sees their results and a billing statement with two separate subtotals and no grand total.

### Phase 9 — Polish
Responsive behaviour · consistent empty/error states everywhere · keyboard accessibility on the Call Card (it's used constantly) · final visual pass.

---

## 7. Definition of done (every phase)

- Builds with **zero errors and zero warnings**.
- Every screen handles loading, error, empty, populated.
- Every error surfaces the backend's real `message`.
- No hardcoded IDs, no mock data, no commented-out placeholder blocks.
- No `console.log` left behind.
- Polling starts only when needed and **always stops**.
- Every destructive action (approve, deactivate, end, archive, reject) goes through a confirm dialog that states the consequence in plain language.
- Nothing sensitive in `localStorage` or a readable cookie.

---

## 8. Do not do these

- ❌ Invent endpoints, query params, or response fields, but let me know if they are really necessary.
- ❌ Modify the backend.
- ❌ Store the access token in `localStorage`.
- ❌ Use a plain `<a href>` for any authenticated download.
- ❌ Sum `costPerLead` and `flatRetainer` subtotals.
- ❌ Show a money figure on a campaign that belongs to a sequence.
- ❌ Multiply the `rates` values by 100.
- ❌ Do arithmetic on `ratePerLead` / `retainerAmount` without coercing from string.
- ❌ Poll indefinitely.
- ❌ Show create/edit/delete affordances anywhere in the client portal.
- ❌ Display a temporary password.
- ❌ Build UI for the `/track/*` or `/webhooks/*` endpoints.
- ❌ Generate multiple phases in one pass.
- ❌ Use emoji or cartoon graphics anywhere in the product UI.

---

**Start with Phase 0. Report what you find, and wait for me before writing any feature code.**
