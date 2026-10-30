import { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  CreditCard,
  Smartphone,
  Building,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Inbox,
  User,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import { formatINR, formatISTDateTime } from '../../api/financialApi';

// Initial avatar color generator
const AVATAR_COLORS = [
  '#ff7a2f',
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f59e0b',
];

function getAvatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name.substring(0, 2) || 'SB').toUpperCase();
}

function TransactionTable({
  transactions = [],
  filteredTotals = {},
  pagination = { page: 1, limit: 10, total_records: 0, total_pages: 1 },
  onPageChange,
  onLimitChange,
  onSortChange,
  currentSort = 'date_desc',
  onSelectTransaction,
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

  const getStatusBadge = (status = '') => {
    switch (status.toLowerCase()) {
      case 'success':
        return (
          <span className="status-badge badge-success">
            <CheckCircle size={12} />
            Success
          </span>
        );
      case 'pending':
        return (
          <span className="status-badge badge-pending">
            <Clock size={12} />
            Pending
          </span>
        );
      case 'failed':
      case 'cancelled':
        return (
          <span className="status-badge badge-failed">
            <XCircle size={12} />
            Failed
          </span>
        );
      case 'refunded':
      case 'partially_refunded':
        return (
          <span className="status-badge badge-refunded">
            <RotateCcw size={12} />
            Refunded
          </span>
        );
      default:
        return <span className="status-badge badge-neutral">{status || 'Unknown'}</span>;
    }
  };

  const getMethodIcon = (method = '') => {
    const m = (method || '').toLowerCase();
    if (m.includes('upi')) return <Smartphone size={14} className="method-icon upi" />;
    if (m.includes('card')) return <CreditCard size={14} className="method-icon card" />;
    if (m.includes('netbanking')) return <Building size={14} className="method-icon netbanking" />;
    return <CreditCard size={14} className="method-icon default" />;
  };

  const page = pagination.page || 1;
  const limit = pagination.limit || 10;
  const totalRecords = pagination.total_records || 0;
  const totalPages = pagination.total_pages || Math.ceil(totalRecords / limit) || 1;

  const startRecord = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalRecords);

  return (
    <div className="financial-table-container">
      {/* Table Header Banner: Filtered Totals Strip */}
      <div className="table-header-banner">
        <div className="banner-title-area">
          <h4 className="banner-title">Transaction Ledger & Settlement Audit</h4>
          <span className="banner-subtitle">
            Real-time accounting breakdown of customer payments and gateway deductions
          </span>
        </div>

        {/* Filtered Totals Micro-Cards */}
        <div className="filtered-totals-strip">
          <div className="total-micro-pill gross">
            <span className="pill-label">Filtered Gross:</span>
            <strong className="pill-val">{formatINR(filteredTotals.gross_amount ?? 0)}</strong>
          </div>

          <div className="total-micro-pill deductions">
            <span className="pill-label">Gateway Deductions:</span>
            <strong className="pill-val">
              −{formatINR(filteredTotals.total_razorpay_charges ?? 0)}
            </strong>
          </div>

          <div className="total-micro-pill inhand highlight">
            <span className="pill-label">Net In-Hand Revenue:</span>
            <strong className="pill-val">
              {formatINR(filteredTotals.net_in_hand_revenue ?? 0)}
            </strong>
          </div>

          {(filteredTotals.refund_amount ?? 0) > 0 && (
            <div className="total-micro-pill refunds">
              <span className="pill-label">Refunds:</span>
              <strong className="pill-val">{formatINR(filteredTotals.refund_amount)}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="table-responsive-wrapper">
        <table className="financial-data-table">
          <thead>
            <tr>
              <th className="th-user">User Details</th>
              <th className="th-plan">Plan & City</th>
              <th className="th-payment">Payment & Gateway</th>
              <th
                className="th-date sortable"
                onClick={() =>
                  onSortChange &&
                  onSortChange(currentSort === 'date_desc' ? 'date_asc' : 'date_desc')
                }
              >
                <div className="th-sort-wrapper">
                  <span>Date (IST)</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th className="th-amount text-right">Gross Amount</th>
              <th className="th-cut text-right">Gateway Cut (2%+GST)</th>
              <th className="th-inhand text-right">Net In-Hand</th>
              <th className="th-status text-center">Status</th>
              <th className="th-action text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              // Loading Skeleton Rows
              Array.from({ length: limit > 8 ? 8 : limit }).map((_, idx) => (
                <tr key={idx} className="table-row-skeleton">
                  <td>
                    <div className="skeleton-user-box">
                      <div className="skeleton-circle" />
                      <div className="skeleton-text-group">
                        <div className="skeleton-bar w-120" />
                        <div className="skeleton-bar w-80" />
                      </div>
                    </div>
                  </td>
                  <td><div className="skeleton-bar w-100" /></td>
                  <td><div className="skeleton-bar w-90" /></td>
                  <td><div className="skeleton-bar w-80" /></td>
                  <td><div className="skeleton-bar w-70 ml-auto" /></td>
                  <td><div className="skeleton-bar w-70 ml-auto" /></td>
                  <td><div className="skeleton-bar w-80 ml-auto" /></td>
                  <td><div className="skeleton-badge-box" /></td>
                  <td><div className="skeleton-btn-box" /></td>
                </tr>
              ))
            ) : transactions.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan="9">
                  <div className="table-empty-state">
                    <div className="empty-icon-wrap">
                      <Inbox size={36} />
                    </div>
                    <h5>No transactions matched your filters</h5>
                    <p>
                      No records found matching the active time period, gateway, or status criteria.
                    </p>
                    {onResetFilters && (
                      <button
                        type="button"
                        className="empty-reset-btn"
                        onClick={onResetFilters}
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              transactions.map((txn) => {
                const user = txn.user || {};
                const plan = txn.plan || {};
                const city = txn.city || {};
                const financials = txn.financials || {};
                const deductions = financials.razorpay_deductions || {};

                const grossAmount = financials.gross_amount ?? plan.price ?? 0;
                const totalDeductions = deductions.total_charges_deducted ?? 0;
                const netInHand = financials.net_in_hand_revenue ?? (grossAmount - totalDeductions);

                const paymentId = txn.payment_id || txn.order_id || 'N/A';
                const avatarColor = getAvatarColor(user.full_name || 'U');

                return (
                  <tr
                    key={txn.id || txn.payment_id}
                    className="financial-table-row"
                    onClick={() => onSelectTransaction && onSelectTransaction(txn)}
                  >
                    {/* 1. User */}
                    <td className="td-user">
                      <div className="user-profile-cell">
                        <div
                          className="user-avatar-circle"
                          style={{ backgroundColor: avatarColor }}
                        >
                          {getInitials(user.full_name || user.email || 'U')}
                        </div>
                        <div className="user-info-text">
                          <strong className="user-name">
                            {user.full_name || 'Anonymous User'}
                          </strong>
                          <span className="user-sub">
                            {user.email || user.phone || `User #${user.id || 'N/A'}`}
                          </span>
                          {user.city && (
                            <span className="user-city-tag">{user.city}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. Plan & City */}
                    <td className="td-plan">
                      <div className="plan-cell">
                        <span className="plan-name-badge">
                          {plan.name || 'Subscription'}
                        </span>
                        {plan.plan_type && (
                          <span className="plan-type-sub">{plan.plan_type}</span>
                        )}
                        {city.name && (
                          <span className="plan-city-text">📍 {city.name}</span>
                        )}
                      </div>
                    </td>

                    {/* 3. Payment Details */}
                    <td className="td-payment">
                      <div className="payment-cell">
                        <div className="gateway-row">
                          <span
                            className={`gateway-badge ${
                              txn.payment_gateway === 'razorpay' ? 'razorpay' : 'apple'
                            }`}
                          >
                            {txn.payment_gateway === 'razorpay' ? 'Razorpay' : txn.payment_gateway || 'Gateway'}
                          </span>
                          <span className="method-pill">
                            {getMethodIcon(txn.payment_method)}
                            <span>{txn.payment_method || 'Online'}</span>
                          </span>
                        </div>

                        {paymentId !== 'N/A' && (
                          <button
                            type="button"
                            className="payment-id-copy-btn"
                            onClick={(e) => handleCopy(paymentId, e)}
                            title="Click to copy Payment ID"
                          >
                            <span>{paymentId}</span>
                            {copiedId === paymentId ? (
                              <Check size={12} className="text-emerald" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 4. Date */}
                    <td className="td-date">
                      <span className="date-main">
                        {formatISTDateTime(txn.transaction_date)}
                      </span>
                    </td>

                    {/* 5. Gross Amount */}
                    <td className="td-amount text-right">
                      <span className="amount-gross">{formatINR(grossAmount)}</span>
                    </td>

                    {/* 6. Gateway Cut */}
                    <td className="td-cut text-right">
                      <span className="amount-cut">−{formatINR(totalDeductions)}</span>
                      {deductions.fee_source && (
                        <span className="fee-source-tag">
                          {deductions.fee_source === 'verified' ? '✓ Verified' : '~ Estimated'}
                        </span>
                      )}
                    </td>

                    {/* 7. Net In-Hand */}
                    <td className="td-inhand text-right">
                      <strong className="amount-inhand text-emerald">
                        {formatINR(netInHand)}
                      </strong>
                    </td>

                    {/* 8. Status */}
                    <td className="td-status text-center">
                      {getStatusBadge(txn.payment_status)}
                    </td>

                    {/* 9. Action */}
                    <td className="td-action text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="view-details-btn"
                        onClick={() => onSelectTransaction && onSelectTransaction(txn)}
                        title="View Full Audit & Reconciliation Details"
                      >
                        <span>Details</span>
                        <ExternalLink size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="table-pagination-footer">
        <div className="pagination-info">
          <span>
            Showing <strong>{startRecord}</strong> to <strong>{endRecord}</strong> of{' '}
            <strong>{totalRecords}</strong> transactions
          </span>
        </div>

        <div className="pagination-controls-group">
          {/* Items Per Page Selector */}
          <div className="limit-selector">
            <span className="limit-label">Show:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange && onLimitChange(Number(e.target.value))}
              className="limit-select"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Page Buttons */}
          <div className="page-nav-buttons">
            <button
              type="button"
              className="nav-page-btn"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange && onPageChange(page - 1)}
              title="Previous Page"
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>

            <span className="page-indicator">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>

            <button
              type="button"
              className="nav-page-btn"
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange && onPageChange(page + 1)}
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

export default TransactionTable;

