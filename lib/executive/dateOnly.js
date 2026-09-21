// The backend stores followUpDate as a full timestamp (midnight UTC of the
// intended calendar day), not a date-only value — see CallRemark model. Two
// traps follow from that, and every screen that shows a follow-up date needs
// to avoid both:
//
// 1. Comparing raw Date objects ("is this timestamp before now?") makes a
//    callback due TODAY register as overdue almost the entire day, since
//    midnight has already passed by the time anyone checks.
// 2. Converting to the browser's local timezone (`new Date(iso).toLocaleDateString()`)
//    can shift the displayed day by one for any timezone west of UTC.
//
// Working off the ISO date fragment as a plain string sidesteps both —
// calendar-day comparison, no timezone reinterpretation.

export const isoDay = (isoString) => isoString.slice(0, 10);

export const todayIso = () => new Date().toISOString().slice(0, 10);

// Renders a YYYY-MM-DD fragment as a local calendar date without parsing it
// as an ISO datetime (which Date treats as UTC midnight).
export function formatDay(day) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}
