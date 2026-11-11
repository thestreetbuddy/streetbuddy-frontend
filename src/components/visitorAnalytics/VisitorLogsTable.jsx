import { useState } from 'react';
import {
  Search,
  Filter,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  RotateCcw,
  UserCheck,
  Sparkles,
  Inbox,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Globe,
  Radio,
} from 'lucide-react';
import { formatISTDateTime } from '../../api/visitorAnalyticsApi';

function truncateVisitorId(id = '') {
  if (!id) return 'sb_v_unknown';
  if (id.length <= 16) return id;
  return `${id.substring(0, 9)}...${id.substring(id.length - 4)}`;
}

function VisitorLogsTable({
  logs = [],
  pagination = { page: 1, limit: 20, total: 0, totalPages: 1 },
  onPageChange,
  onLimitChange,
  deviceFilter = 'all',
  onDeviceFilterChange,
  searchTerm = '',
  onSearchChange,
  loading = false,
  onResetFilters,
}) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text, e) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDeviceIcon = (device = '') => {
    const d = device.toLowerCase();
    if (d === 'mobile') return <Smartphone size={14} className="device-icon mobile" />;
    if (d === 'tablet') return <Tablet size={14} className="device-icon tablet" />;
    return <Monitor size={14} className="device-icon desktop" />;
  };

  const page = pagination.page || 1;
  const limit = pagination.limit || 20;
  const total = pagination.total || 0;
  const totalPages = pagination.totalPages || Math.ceil(total / limit) || 1;

  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="visitor-logs-container">
      {/* Table Header and Filters Bar */}
      <div className="logs-header-bar">
        <div className="logs-header-left">
          <div className="logs-title-row">
            <h4 className="logs-title">Live Website Visitor Activity Logs</h4>
            <span className="logs-counter-badge">
              {total.toLocaleString('en-IN')} Visitors Recorded
            </span>
          </div>
          <p className="logs-subtitle">
            Real-time chronological footprint of individual anonymous visitor sessions
          </p>
        </div>

        {/* Filter controls */}
        <div className="logs-controls-right">
          {/* Search Box */}
          <div className="logs-search-box">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search IP, Visitor ID, Path..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="logs-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => onSearchChange('')}
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Device Filter */}
          <div className="logs-filter-box">
            <Filter size={14} className="filter-icon" />
            <select
              value={deviceFilter}
              onChange={(e) => onDeviceFilterChange(e.target.value)}
              className="logs-filter-select"
            >
              <option value="all">All Devices</option>
              <option value="Mobile">Mobile Only</option>
              <option value="Desktop">Desktop Only</option>
              <option value="Tablet">Tablet Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-responsive-box">
        <table className="visitor-table">
          <thead>
            <tr>
              <th className="th-id"># ID</th>
              <th className="th-visitor">Visitor ID</th>
              <th className="th-ip">IP Address</th>
              <th className="th-device">Device</th>
              <th className="th-visits text-center">Visit Count</th>
              <th className="th-status text-center">Status</th>
              <th className="th-duration text-center">Active Time</th>
              <th className="th-seen">First Seen (IST)</th>
              <th className="th-seen">Last Seen (IST)</th>
              <th className="th-path">Landing Path</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              // Loading Skeletons
              Array.from({ length: limit > 8 ? 8 : limit }).map((_, idx) => (
                <tr key={idx} className="skeleton-row">
                  <td><div className="sk-bar w-30" /></td>
                  <td><div className="sk-bar w-120" /></td>
                  <td><div className="sk-bar w-100" /></td>
                  <td><div className="sk-bar w-70" /></td>
                  <td><div className="sk-bar w-60 mx-auto" /></td>
                  <td><div className="sk-bar w-80 mx-auto" /></td>
                  <td><div className="sk-bar w-70 mx-auto" /></td>
                  <td><div className="sk-bar w-110" /></td>
                  <td><div className="sk-bar w-110" /></td>
                  <td><div className="sk-bar w-60" /></td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan="10">
                  <div className="logs-empty-state">
                    <div className="empty-circle-icon">
                      <Inbox size={32} />
                    </div>
                    <h5>No visitor logs found</h5>
                    <p>
                      No sessions match the selected search, device, or date range.
                    </p>
                    {onResetFilters && (
                      <button
                        type="button"
                        className="reset-filters-btn"
                        onClick={onResetFilters}
                      >
                        Reset Filter Criteria
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              logs.map((log, index) => {
                const isRepeat = (log.visitCount || 1) > 1;
                const isCopied = copiedId === log.visitorId;

                return (
                  <tr key={log.id || log.visitorId || index} className="visitor-row">
                    {/* 1. ID */}
                    <td className="td-id">
                      <span className="log-index">
                        {(page - 1) * limit + index + 1}
                      </span>
                    </td>

                    {/* 2. Visitor ID */}
                    <td className="td-visitor">
                      <button
                        type="button"
                        className={`visitor-copy-pill ${isCopied ? 'copied' : ''}`}
                        onClick={(e) => handleCopy(log.visitorId, e)}
                        title={`Click to copy full ID: ${log.visitorId}`}
                      >
                        <span className="mono-id">{truncateVisitorId(log.visitorId)}</span>
                        {isCopied ? (
                          <Check size={12} className="text-emerald" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </td>

                    {/* 3. IP Address */}
                    <td className="td-ip">
                      <span className="ip-text">{log.ipAddress || '—'}</span>
                    </td>

                    {/* 4. Device */}
                    <td className="td-device">
                      <div className="device-pill">
                        {getDeviceIcon(log.device)}
                        <span>{log.device || 'Desktop'}</span>
                      </div>
                    </td>

                    {/* 5. Visit Count */}
                    <td className="td-visits text-center">
                      <span className={`visit-count-badge ${isRepeat ? 'repeat' : 'single'}`}>
                        {log.visitCount || 1} {isRepeat ? 'visits' : 'visit'}
                      </span>
                    </td>

                    {/* 6. Status */}
                    <td className="td-status text-center">
                      {log.isNewVisitor ? (
                        <span className="status-badge-pill new">
                          <Sparkles size={11} />
                          New
                        </span>
                      ) : (
                        <span className="status-badge-pill returning">
                          <RotateCcw size={11} />
                          Returning
                        </span>
                      )}
                    </td>

                    {/* 7. Active Time */}
                    <td className="td-duration text-center">
                      <div className="duration-pill">
                        <Clock size={12} />
                        <span>{log.activeDurationText || '< 1m'}</span>
                      </div>
                    </td>

                    {/* 8. First Seen */}
                    <td className="td-seen">
                      <span className="time-val">
                        {formatISTDateTime(log.firstSeenAt, true)}
                      </span>
                    </td>

                    {/* 9. Last Seen */}
                    <td className="td-seen">
                      <span className="time-val">
                        {formatISTDateTime(log.lastSeenAt, true)}
                      </span>
                    </td>

                    {/* 10. Landing Path */}
                    <td className="td-path">
                      <div className="path-chip" title={`Referrer: ${log.referrer || 'Direct'}`}>
                        <span className="path-route">{log.path || '/'}</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="logs-pagination-footer">
        <div className="pagination-summary">
          <span>
            Showing <strong>{startRecord}</strong> to <strong>{endRecord}</strong> of{' '}
            <strong>{total.toLocaleString('en-IN')}</strong> visitors
          </span>
        </div>

        <div className="pagination-right-controls">
          {/* Limit selector */}
          <div className="limit-box">
            <span className="limit-lbl">Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="limit-dropdown"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Navigation Buttons */}
          <div className="page-nav-group">
            <button
              type="button"
              className="p-btn"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
              title="Previous Page"
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>

            <span className="page-num-display">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>

            <button
              type="button"
              className="p-btn"
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange(page + 1)}
              title="Next Page"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VisitorLogsTable;

