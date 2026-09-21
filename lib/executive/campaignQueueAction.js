// A call campaign's status decides whether an executive can actually dial
// right now, and if not, why. Centralized here so the dashboard, the
// campaigns list, and the campaign detail page all describe the same state
// the same way instead of drifting independently.
//
// `enabled: false` means there is nothing to view at all (a draft campaign
// has no frozen audience yet, so its queue, callbacks, and history are
// guaranteed empty) — the caller should render a disabled affordance rather
// than link into a page that has nothing on it. Every other status still
// has real content (callbacks-due, history, stats) worth viewing even when
// dialing itself is blocked.
const ACTIONS = {
  active: {
    label: "Open Queue",
    detailLabel: "Start Dialing",
    icon: "bi-telephone-outbound",
    variant: "primary",
    enabled: true,
    canDial: true,
    reason: null
  },
  paused: {
    label: "View Details",
    detailLabel: "Campaign Paused",
    icon: "bi-pause-circle",
    variant: "outline-warning",
    enabled: true,
    canDial: false,
    reason: "This campaign is paused. You can still review callbacks and history, but dialing is unavailable until your manager resumes it."
  },
  completed: {
    label: "View Summary",
    detailLabel: "Campaign Completed",
    icon: "bi-clipboard-check",
    variant: "outline-secondary",
    enabled: true,
    canDial: false,
    reason: "This campaign is complete — every lead has been worked through. No further calls are needed."
  },
  draft: {
    label: "Awaiting Approval",
    detailLabel: "Awaiting Approval",
    icon: "bi-hourglass-split",
    variant: "outline-secondary",
    enabled: false,
    canDial: false,
    reason: "Your manager hasn't approved this campaign yet, so there's no audience to call. Check back once it's live."
  }
};

export function getCampaignQueueAction(status) {
  return ACTIONS[status] || ACTIONS.draft;
}
