"use client";
import { useEffect, useRef } from "react";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";

/**
 * ToastNotification - Bootstrap 5 toast-based replacement for browser alert().
 *
 * Props:
 *   show       {boolean}  - Whether the toast is visible.
 *   onClose    {Function} - Called when the toast closes.
 *   message    {string}   - The message to display.
 *   variant    {string}   - Bootstrap colour variant: 'success' | 'danger' | 'warning' | 'info'. Default 'info'.
 *   autohide   {boolean}  - Whether the toast auto-hides. Default true.
 *   delay      {number}   - Auto-hide delay in ms. Default 4000.
 */
export function ToastNotification({
  show,
  onClose,
  message,
  variant = "info",
  autohide = true,
  delay = 4000,
}) {
  const ICONS = {
    success: "bi-check-circle-fill",
    danger: "bi-x-circle-fill",
    warning: "bi-exclamation-triangle-fill",
    info: "bi-info-circle-fill",
  };
  const TITLES = {
    success: "Success",
    danger: "Error",
    warning: "Warning",
    info: "Info",
  };

  return (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
      <Toast
        show={show}
        onClose={onClose}
        autohide={autohide}
        delay={delay}
        className={`border-0 shadow`}
      >
        <Toast.Header className={`bg-${variant} text-white border-0`}>
          <i className={`bi ${ICONS[variant] || ICONS.info} me-2`} />
          <strong className="me-auto">{TITLES[variant] || "Notification"}</strong>
        </Toast.Header>
        <Toast.Body className="text-dark bg-white">{message}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
}
