import { useState } from 'react';
import {
  Calendar,
  Filter,
  RefreshCw,
  RotateCcw,
  Zap,
  CreditCard,
  Search,
  X,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days (Default)' },
  { value: 'this_month', label: 'This Month' },
  { value: 'previous_month', label: 'Previous Month' },
  { value: 'custom', label: 'Custom Range...' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'success', label: 'Success' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const GATEWAY_OPTIONS = [
  { value: 'all', label: 'All Gateways' },
  { value: 'razorpay', label: 'Razorpay' },
  { value: 'apple_iap', label: 'Apple IAP' },
];

function FinancialFiltersBar({
  filters,
  onFilterChange,
  onRefresh,
  onSyncRazorpay,
  isRefreshing = false,
  isSyncing = false,
  lastSyncResult = null,
}) {
  const [customStart, setCustomStart] = useState(filters.startDate || '');
  const [customEnd, setCustomEnd] = useState(filters.endDate || '');

  const handlePeriodChange = (e) => {
    const period = e.target.value;
    if (period !== 'custom') {
      onFilterChange({
        ...filters,
        period,
        startDate: '',
        endDate: '',
      });
    } else {
      onFilterChange({
        ...filters,
        period: 'custom',
      });
    }
  };

  const handleApplyCustomDates = () => {
    if (!customStart || !customEnd) return;
    onFilterChange({
      ...filters,
      period: 'custom',
      startDate: customStart,
      endDate: customEnd,
    });
  };

  const handleStatusChange = (e) => {
    onFilterChange({
      ...filters,
      paymentStatus: e.target.value,
    });
  };

  const handleGatewayChange = (e) => {
    onFilterChange({
      ...filters,
      paymentGateway: e.target.value,
    });
  };

  const handleSearchChange = (e) => {
    onFilterChange({
      ...filters,
      searchQuery: e.target.value,
    });
  };

  const handleResetFilters = () => {
    setCustomStart('');
    setCustomEnd('');
    onFilterChange({
      period: 'last_30_days',
      startDate: '',
      endDate: '',
      paymentStatus: 'all',
      paymentGateway: 'all',
      paymentMethod: 'all',
      searchQuery: '',
    });
  };

  const hasActiveFilters =
    filters.period !== 'last_30_days' ||
    filters.paymentStatus !== 'all' ||
    filters.paymentGateway !== 'all' ||
    (filters.paymentMethod && filters.paymentMethod !== 'all') ||
    Boolean(filters.searchQuery) ||
    Boolean(filters.startDate);

  return (
    <div className="financial-filters-wrapper">
      <div className="filters-main-row">
        {/* Left Section: Filter Controls */}
        <div className="filters-left-group">
          {/* Time Period Selector */}
          <div className="filter-input-box">
            <span className="filter-icon">
              <Calendar size={16} />
            </span>
            <label htmlFor="period-select" className="visually-hidden">Time Period</label>
            <select
              id="period-select"
              value={filters.period || 'last_30_days'}
              onChange={handlePeriodChange}
              className="filter-select"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Selector */}
          <div className="filter-input-box">
            <span className="filter-icon">
              <Filter size={16} />
            </span>
            <label htmlFor="status-select" className="visually-hidden">Payment Status</label>
            <select
              id="status-select"
              value={filters.paymentStatus || 'all'}
              onChange={handleStatusChange}
              className="filter-select"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Gateway Selector */}
          <div className="filter-input-box">
            <span className="filter-icon">
              <CreditCard size={16} />
            </span>
            <label htmlFor="gateway-select" className="visually-hidden">Payment Gateway</label>
            <select
              id="gateway-select"
              value={filters.paymentGateway || 'all'}
              onChange={handleGatewayChange}
              className="filter-select"
            >
              {GATEWAY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input for quick txn or user filter */}
          <div className="filter-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Payment ID, Order ID, User..."
              value={filters.searchQuery || ''}
              onChange={handleSearchChange}
              className="filter-search-input"
            />
            {filters.searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="filter-reset-btn"
              onClick={handleResetFilters}
              title="Reset all filters to default"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Right Section: Action Buttons */}
        <div className="filters-right-actions">
          {/* Refresh Data Button */}
          <button
            type="button"
            className="action-btn refresh-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh summary, revenue trends, and transactions"
          >
            <RefreshCw size={16} className={isRefreshing ? 'spin-anim' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>

          {/* Sync Razorpay Fees Button */}
          <button
            type="button"
            className="action-btn sync-btn"
            onClick={onSyncRazorpay}
            disabled={isSyncing}
            title="Trigger reconciliation with Razorpay API to verify fees & GST"
          >
            <Zap size={16} className={isSyncing ? 'pulse-anim text-amber' : ''} />
            <span>{isSyncing ? 'Syncing Fees...' : 'Sync Razorpay Fees'}</span>
          </button>
        </div>
      </div>

      {/* Custom Date Pickers Sub-bar (if custom period selected) */}
      {filters.period === 'custom' && (
        <div className="custom-date-bar">
          <div className="date-input-group">
            <span className="date-label">Start Date:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="date-input"
            />
          </div>

          <div className="date-input-group">
            <span className="date-label">End Date:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="date-input"
            />
          </div>

          <button
            type="button"
            className="apply-dates-btn"
            onClick={handleApplyCustomDates}
            disabled={!customStart || !customEnd}
          >
            Apply Range
          </button>
        </div>
      )}

      {/* Sync Banner Notice if recent sync occurred */}
      {lastSyncResult && (
        <div className="sync-result-toast">
          <div className="toast-content">
            <CheckCircle2 size={16} className="text-emerald" />
            <span>
              {lastSyncResult.message || 'Razorpay fees and deductions successfully synced!'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinancialFiltersBar;

