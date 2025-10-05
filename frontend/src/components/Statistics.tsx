/**
 * Statistics Component
 *
 * Displays aggregated statistics for HTTP response monitoring in card format.
 * Shows total requests, successful responses, failed responses, and average response time.
 *
 * @component
 */

import type { Statistics as StatisticsType } from "../types";
import "./Statistics.css";

interface StatisticsProps {
  /** Statistics data to display, null while loading */
  statistics: StatisticsType | null;
}

/**
 * Renders statistics cards showing HTTP response metrics
 */
export const Statistics = ({ statistics }: StatisticsProps) => {
  // Show loading state while statistics are being fetched
  if (!statistics) {
    return (
      <div className="statistics-container">
        <div className="stat-card">
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  // Calculate success rate percentage
  const successRate =
    statistics.total > 0
      ? ((statistics.successful / statistics.total) * 100).toFixed(1)
      : "0";

  // Calculate failure rate percentage
  const failureRate =
    statistics.total > 0
      ? ((statistics.failed / statistics.total) * 100).toFixed(1)
      : "0";

  return (
    <div className="statistics-container">
      {/* Total Requests Card */}
      <div className="stat-card">
        <div className="stat-icon" aria-hidden="true">
          📊
        </div>
        <div className="stat-content">
          <h3>Total Requests</h3>
          <p className="stat-value">{statistics.total}</p>
        </div>
      </div>

      {/* Successful Requests Card */}
      <div className="stat-card success">
        <div className="stat-icon" aria-hidden="true">
          ✅
        </div>
        <div className="stat-content">
          <h3>Successful</h3>
          <p className="stat-value">{statistics.successful}</p>
          <p className="stat-subtitle">{successRate}% success rate</p>
        </div>
      </div>

      {/* Failed Requests Card */}
      <div className="stat-card failed">
        <div className="stat-icon stat-icon-failed" aria-hidden="true">
          ✖
        </div>
        <div className="stat-content">
          <h3>Failed</h3>
          <p className="stat-value">{statistics.failed}</p>
          <p className="stat-subtitle">{failureRate}% failure rate</p>
        </div>
      </div>

      {/* Average Response Time Card */}
      <div className="stat-card">
        <div className="stat-icon" aria-hidden="true">
          ⚡
        </div>
        <div className="stat-content">
          <h3>Avg Response Time</h3>
          <p className="stat-value">
            {statistics.averageResponseTime.toFixed(0)}ms
          </p>
        </div>
      </div>
    </div>
  );
};
