"use client";

import Badge from "react-bootstrap/Badge";

const VARIANT_BY_STATUS = {
  active: "success",
  paused: "warning",
  completed: "info",
  draft: "secondary"
};

export default function CampaignStatusBadge({ status, className = "" }) {
  return (
    <Badge
      bg={VARIANT_BY_STATUS[status] || "secondary"}
      className={`px-3 py-2 rounded-pill text-uppercase ${className}`}
    >
      {status}
    </Badge>
  );
}
