import React from 'react';
import { Modal, Button } from 'react-bootstrap';

export function ConfirmDialog({ show, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'primary', onConfirm, onCancel, isProcessing = false }) {
  return (
    <Modal show={show} onHide={onCancel} centered backdrop="static">
      <Modal.Header closeButton={!isProcessing}>
        <Modal.Title className="h5 fw-semibold">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0 text-dark">{message}</p>
      </Modal.Body>
      <Modal.Footer className="border-top-0">
        <Button variant="light" onClick={onCancel} disabled={isProcessing}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm} disabled={isProcessing}>
          {isProcessing ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Processing...
            </>
          ) : (
            confirmText
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
