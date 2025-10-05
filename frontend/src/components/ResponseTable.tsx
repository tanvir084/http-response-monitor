/**
 * ResponseTable Component
 *
 * Displays HTTP response data in a paginated table format with expandable details.
 * Each row shows summary information and can be expanded to view full request/response data.
 *
 * Features:
 * - Paginated table view
 * - Expandable rows for detailed information
 * - Status code visualization with icons
 * - Response time highlighting
 * - Loading and empty states
 *
 * @component
 */

import { useState } from "react";
import type { HttpResponse } from "../types";
import "./ResponseTable.css";

interface ResponseTableProps {
  responses: HttpResponse[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const ResponseTable = ({
  responses,
  loading,
  currentPage,
  totalPages,
  onPageChange,
}: ResponseTableProps) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const toggleRowExpansion = (rowId: string): void => {
    setExpandedRowId(expandedRowId === rowId ? null : rowId);
  };

  const formatDateTime = (isoDateString: string): string => {
    const date = new Date(isoDateString);
    return date.toLocaleString();
  };

  const getStatusBadgeClass = (statusCode: number): string => {
    if (statusCode === 0) return "status-no-response";
    if (statusCode >= 200 && statusCode < 300) return "status-success";
    if (statusCode >= 400 && statusCode < 500) return "status-client-error";
    if (statusCode >= 500) return "status-server-error";
    return "status-info";
  };

  const getStatusIcon = (statusCode: number, errorMessage?: string): string => {
    if (statusCode === 0) return "🔴";
    if (errorMessage || statusCode >= 500) return "❌";
    if (statusCode >= 400) return "⚠️";
    if (statusCode >= 200 && statusCode < 300) return "✅";
    return "🔵";
  };

  const getStatusDisplayText = (statusCode: number): string => {
    if (statusCode === 0) return "Connection Failed";
    return statusCode.toString();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" aria-label="Loading"></div>
        <p>Loading responses...</p>
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="empty-state">
        <p>No responses yet. Waiting for the next ping...</p>
      </div>
    );
  }

  return (
    <div className="response-table-container">
      <div className="table-wrapper">
        <table className="response-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Status</th>
              <th>Response Time</th>
              <th>Request ID</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {responses.map((response) => (
              <>
                <tr key={response._id} className="table-row">
                  <td className="timestamp-cell">
                    {formatDateTime(response.timestamp)}
                  </td>

                  <td>
                    <span
                      className={`status-badge ${getStatusBadgeClass(
                        response.statusCode
                      )}`}
                      aria-label={`Status: ${response.statusCode}`}
                    >
                      {getStatusIcon(response.statusCode, response.error)}{" "}
                      {getStatusDisplayText(response.statusCode)}
                    </span>
                  </td>

                  <td className="response-time-cell">
                    <strong>{response.responseTime}ms</strong>
                  </td>

                  <td className="request-id">
                    {String(response.requestPayload?.requestId || "N/A")}
                  </td>

                  <td>
                    <button
                      onClick={() => toggleRowExpansion(response._id)}
                      className="btn-expand"
                      aria-expanded={expandedRowId === response._id}
                      aria-label={
                        expandedRowId === response._id
                          ? "Hide details"
                          : "Show details"
                      }
                    >
                      {expandedRowId === response._id ? "▲ Hide" : "▼ Details"}
                    </button>
                  </td>
                </tr>

                {expandedRowId === response._id && (
                  <tr className="expanded-row">
                    <td colSpan={5}>
                      <div className="details-container">
                        <div className="detail-section">
                          <h4>📤 Request Payload</h4>
                          <pre>
                            {JSON.stringify(response.requestPayload, null, 2)}
                          </pre>
                        </div>

                        <div className="detail-section">
                          <h4>📥 Response Data</h4>
                          <pre>
                            {typeof response.responseData === "string"
                              ? response.responseData
                              : JSON.stringify(response.responseData, null, 2)}
                          </pre>
                        </div>

                        {response.error && (
                          <div className="detail-section error-section">
                            <h4>❌ Error Details</h4>
                            <pre>{response.error}</pre>
                          </div>
                        )}

                        <div className="detail-section">
                          <h4>📋 Additional Info</h4>
                          <pre>
                            {JSON.stringify(
                              {
                                url: response.url,
                                statusCode: response.statusCode,
                                responseTime: `${response.responseTime}ms`,
                                timestamp: response.timestamp,
                              },
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn-pagination"
          aria-label="Go to previous page"
        >
          ← Previous
        </button>

        <span className="page-info" aria-live="polite">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn-pagination"
          aria-label="Go to next page"
        >
          Next →
        </button>
      </div>
    </div>
  );
};