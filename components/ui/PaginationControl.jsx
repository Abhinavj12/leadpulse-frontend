"use client";

import React from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

export function PaginationControl({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemName = "items",
  className = ""
}) {
  if (totalItems <= 0 && totalPages <= 1) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers range for page jumper
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return { pages, startPage, endPage };
  };

  const { pages, startPage, endPage } = getPageNumbers();

  return (
    <div className={`d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 p-3 bg-white border-top rounded-bottom ${className}`}>
      {/* ITEMS COUNT & PAGE SIZE SELECTOR */}
      <div className="d-flex align-items-center gap-3 text-muted small">
        <span>
          Showing <strong>{totalItems > 0 ? startItem : 0}</strong> - <strong>{endItem}</strong> of <strong>{totalItems}</strong> {itemName}
        </span>

        {onPageSizeChange && (
          <div className="d-flex align-items-center gap-1 ms-2">
            <span className="text-secondary small">Per page:</span>
            <Form.Select
              size="sm"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{ width: "70px", paddingRight: "1.5rem" }}
              className="py-0 px-2 text-muted fw-semibold"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Form.Select>
          </div>
        )}
      </div>

      {/* PAGE CONTROLS */}
      {totalPages > 1 && (
        <div className="d-flex align-items-center gap-1">
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-2 py-1 border-0"
            title="Previous Page"
          >
            <i className="bi bi-chevron-left"></i>
          </Button>

          {startPage > 1 && (
            <>
              <Button
                variant={currentPage === 1 ? "primary" : "light"}
                size="sm"
                onClick={() => onPageChange(1)}
                className="px-2 py-1 text-nowrap fw-semibold"
              >
                1
              </Button>
              {startPage > 2 && <span className="text-muted px-1">...</span>}
            </>
          )}

          {pages.map((p) => (
            <Button
              key={p}
              variant={currentPage === p ? "primary" : "outline-light"}
              size="sm"
              onClick={() => onPageChange(p)}
              className={`px-2 py-1 fw-semibold ${currentPage === p ? "text-white" : "text-dark border-0"}`}
            >
              {p}
            </Button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="text-muted px-1">...</span>}
              <Button
                variant={currentPage === totalPages ? "primary" : "light"}
                size="sm"
                onClick={() => onPageChange(totalPages)}
                className="px-2 py-1 text-nowrap fw-semibold"
              >
                {totalPages}
              </Button>
            </>
          )}

          <Button
            variant="outline-secondary"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-2 py-1 border-0"
            title="Next Page"
          >
            <i className="bi bi-chevron-right"></i>
          </Button>
        </div>
      )}
    </div>
  );
}
