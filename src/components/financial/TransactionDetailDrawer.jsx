import { useEffect, useState } from 'react';
import {
  X,
  User,
  Package,
  Receipt,
  Code,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  ShieldCheck,
  ExternalLink,
  Percent,
} from 'lucide-react';
import {
  formatINR,
  formatISTDateTime,
  getTransactionDetails,
} from '../../api/financialApi';

function TransactionDetailDrawer({ transaction, onClose }) {
  const [detailData, setDetailData] = useState(transaction);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'customer' | 'raw'

  // Fetch full details from API if transaction id is provided
  useEffect(() => {
    if (!transaction?.id) {
      setDetailData(transaction);
      return;
    }

    let isMounted = true;
    const fetchFullDetails = async () => {
      setLoadingDetails(true);
      try {
        const res = await getTransactionDetails(transaction.id);
        const data = res.data?.data || res.data || transaction;
        if (isMounted) {
          setDetailData(data);
        }
      } catch (err) {
        console.warn('Failed to fetch detailed txn data, fallback to row data:', err);
        if (isMounted) {
          setDetailData(transaction);
        }
      } finally {
        if (isMounted) {
          setLoadingDetails(false);
        }
      }
    };

    fetchFullDetails();

    return () => {
      isMounted = false;
    };
  }, [transaction]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!transaction) return null;

  const data = detailData || transaction;
  const user = data.user || {};
  const plan = data.plan || {};
  const city = data.city || {};
  const financials = data.financials || {};
  const deductions = financials.razorpay_deductions || {};
  const customerGst = financials.customer_gst || {};

  const grossAmount = financials.gross_amount ?? plan.price ?? 0;
  const planBaseAmount = financials.plan_base_amount ?? 0;
  const platformFee = deductions.platform_fee_excluding_gst ?? 0;
  const gstOnFee = deductions.gst_on_platform_fee ?? 0;
  const totalDeductions = deductions.total_charges_deducted ?? 0;
  const netInHand = financials.net_in_hand_revenue ?? (grossAmount - totalDeductions);

  const handleCopy = (val, fieldName) => {
    if (!val) return;
    navigator.clipboard?.writeText(String(val));
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const getStatusBadge = (status = '') => {
    switch (status.toLowerCase()) {
      case 'success':
        return (
          <span className="drawer-status-badge badge-success">
            <CheckCircle size={13} />
            Success
          </span>
        );
      case 'pending':
        return (
          <span className="drawer-status-badge badge-pending">
            <Clock size={13} />
            Pending
          </span>
        );
      case 'failed':
      case 'cancelled':
        return (
          <span className="drawer-status-badge badge-failed">
            <XCircle size={13} />
            Failed
          </span>
        );
      case 'refunded':
      case 'partially_refunded':
        return (
          <span className="drawer-status-badge badge-refunded">
            <RotateCcw size={13} />
            Refunded
          </span>
        );
      default:
        return <span className="drawer-status-badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-header-left">
            <div className="drawer-title-row">
              <h3 className="drawer-title">Transaction Audit Record</h3>
              {getStatusBadge(data.payment_status)}
            </div>
            <div className="drawer-id-row">
              <span className="drawer-id-label">Payment ID:</span>
              <button
                type="button"
                className="copy-pill-btn"
                onClick={() => handleCopy(data.payment_id || data.order_id, 'payment_id')}
                title="Copy Payment ID"
              >
                <span>{data.payment_id || data.order_id || `TXN #${data.id}`}</span>
                {copiedField === 'payment_id' ? (
                  <Check size={12} className="text-emerald" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>
          </div>

          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="drawer-tabs">
          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <Receipt size={15} />
            <span>Financial Audit</span>
          </button>

          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'customer' ? 'active' : ''}`}
            onClick={() => setActiveTab('customer')}
          >
            <User size={15} />
            <span>Customer & Plan</span>
          </button>

          <button
            type="button"
            className={`drawer-tab-btn ${activeTab === 'raw' ? 'active' : ''}`}
            onClick={() => setActiveTab('raw')}
          >
            <Code size={15} />
            <span>Technical JSON</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="drawer-body">
          {activeTab === 'audit' && (
            <div className="tab-pane audit-pane">
              {/* Highlight Hero Card */}
              <div className="settlement-hero-card">
                <span className="hero-sub">Net In-Hand Settlement</span>
                <strong className="hero-amount text-emerald">{formatINR(netInHand)}</strong>
                <div className="hero-details">
                  <span>Gross: {formatINR(grossAmount)}</span>
                  <span className="dot">•</span>
                  <span>Gateway Cut: −{formatINR(totalDeductions)}</span>
                </div>
              </div>

              {/* Step-by-Step Accounting Waterfall */}
              <div className="audit-section-box">
                <h4 className="section-title">
                  <Receipt size={16} />
                  Revenue Accounting Waterfall
                </h4>

                <div className="audit-waterfall-list">
                  {/* Step 1: Base Amount */}
                  <div className="waterfall-row">
                    <span className="row-label">Plan Base Price (Excl. Customer GST)</span>
                    <strong className="row-val">
                      {formatINR(planBaseAmount || grossAmount)}
                    </strong>
                  </div>

                  {/* Step 2: Customer GST Collected */}
                  {(customerGst.total_gst_amount || 0) > 0 && (
                    <>
                      <div className="waterfall-row indented">
                        <span className="row-label">CGST (9%)</span>
                        <span className="row-val">+{formatINR(customerGst.cgst_amount || 0)}</span>
                      </div>
                      <div className="waterfall-row indented">
                        <span className="row-label">SGST (9%)</span>
                        <span className="row-val">+{formatINR(customerGst.sgst_amount || 0)}</span>
                      </div>
                      <div className="waterfall-row">
                        <span className="row-label">Total Customer GST Collected</span>
                        <strong className="row-val">
                          +{formatINR(customerGst.total_gst_amount || 0)}
                        </strong>
                      </div>
                    </>
                  )}

                  {/* Step 3: Total Gross Paid */}
                  <div className="waterfall-row subtotal">
                    <span className="row-label">Customer Paid (Gross Revenue)</span>
                    <strong className="row-val text-blue">{formatINR(grossAmount)}</strong>
                  </div>

                  {/* Step 4: Razorpay Deductions */}
                  <div className="waterfall-row deduction">
                    <div className="deduction-label-group">
                      <span className="row-label">Razorpay Platform 2% Base Fee</span>
                      <small className="fee-type">Excluding GST</small>
                    </div>
                    <strong className="row-val text-amber">−{formatINR(platformFee)}</strong>
                  </div>

                  <div className="waterfall-row deduction">
                    <div className="deduction-label-group">
                      <span className="row-label">GST on Gateway Fee (18%)</span>
                      <small className="fee-type">18% of platform fee</small>
                    </div>
                    <strong className="row-val text-amber">−{formatINR(gstOnFee)}</strong>
                  </div>

                  <div className="waterfall-row subtotal deduction">
                    <span className="row-label">Total Razorpay Platform Cut</span>
                    <strong className="row-val text-amber">−{formatINR(totalDeductions)}</strong>
                  </div>

                  {/* Refunds if any */}
                  {(financials.refund_amount || 0) > 0 && (
                    <div className="waterfall-row deduction">
                      <span className="row-label">Customer Refund</span>
                      <strong className="row-val text-rose">
                        −{formatINR(financials.refund_amount)}
                      </strong>
                    </div>
                  )}

                  {/* Final Net In-Hand */}
                  <div className="waterfall-row net-total highlight">
                    <div className="net-title-group">
                      <span className="row-label">Net In-Hand Revenue (Key Metric)</span>
                      <small>Actual Bank Settlement Deposited</small>
                    </div>
                    <strong className="row-val text-emerald">{formatINR(netInHand)}</strong>
                  </div>
                </div>
              </div>

              {/* Audit Meta Information */}
              <div className="audit-section-box">
                <h4 className="section-title">
                  <ShieldCheck size={16} />
                  Settlement & Reconciliation Details
                </h4>

                <div className="audit-meta-grid">
                  <div className="meta-item">
                    <span className="meta-label">Settlement Status</span>
                    <span className="meta-val highlight-badge">
                      {financials.settlement_status || 'Processed'}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">Fee Verification Source</span>
                    <span className="meta-val">
                      {deductions.fee_source === 'verified' ? '✓ Verified from Razorpay' : '~ Estimated (2% + 18%)'}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">Payment Gateway</span>
                    <span className="meta-val">{data.payment_gateway || 'Razorpay'}</span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">Payment Method</span>
                    <span className="meta-val">{data.payment_method || 'Online'}</span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">Transaction Date</span>
                    <span className="meta-val">{formatISTDateTime(data.transaction_date)}</span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">Currency</span>
                    <span className="meta-val">{data.currency || 'INR'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customer' && (
            <div className="tab-pane customer-pane">
              {/* Customer Profile Box */}
              <div className="audit-section-box">
                <h4 className="section-title">
                  <User size={16} />
                  Customer Information
                </h4>

                <div className="customer-info-grid">
                  <div className="info-field">
                    <span className="info-label">Full Name</span>
                    <strong className="info-val">{user.full_name || 'Anonymous User'}</strong>
                  </div>

                  <div className="info-field">
                    <span className="info-label">Email Address</span>
                    <strong className="info-val">{user.email || '—'}</strong>
                  </div>

                  <div className="info-field">
                    <span className="info-label">Phone Number</span>
                    <strong className="info-val">{user.phone || '—'}</strong>
                  </div>

                  <div className="info-field">
                    <span className="info-label">City / State</span>
                    <strong className="info-val">
                      {user.city || city.name || '—'}
                      {user.state ? `, ${user.state}` : ''}
                    </strong>
                  </div>

                  <div className="info-field">
                    <span className="info-label">User ID</span>
                    <button
                      type="button"
                      className="copy-pill-btn"
                      onClick={() => handleCopy(user.id, 'user_id')}
                    >
                      <span>#{user.id || 'N/A'}</span>
                      {copiedField === 'user_id' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Plan Metadata Box */}
              <div className="audit-section-box">
                <h4 className="section-title">
                  <Package size={16} />
                  Plan & Subscription Details
                </h4>

                <div className="customer-info-grid">
                  <div className="info-field">
                    <span className="info-label">Plan Name</span>
                    <strong className="info-val">{plan.name || 'Membership Plan'}</strong>
                  </div>

                  <div className="info-field">
                    <span className="info-label">Plan Type</span>
                    <strong className="info-val">{plan.plan_type || 'Monthly'}</strong>
                  </div>

                  <div className="info-field">
                    <span className="info-label">Standard Plan Price</span>
                    <strong className="info-val">{formatINR(plan.price || grossAmount)}</strong>
                  </div>

                  <div className="info-field">
                    <span className="info-label">Designated City</span>
                    <strong className="info-val">{city.name || 'All Cities'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="tab-pane raw-pane">
              <div className="json-header-row">
                <span className="json-caption">Complete Transaction & Gateway Payload</span>
                <button
                  type="button"
                  className="copy-json-btn"
                  onClick={() => handleCopy(JSON.stringify(data, null, 2), 'raw_json')}
                >
                  {copiedField === 'raw_json' ? (
                    <>
                      <Check size={14} className="text-emerald" />
                      <span>Copied JSON</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="json-code-box">
                <code>{JSON.stringify(data, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="drawer-footer">
          <button type="button" className="drawer-footer-close-btn" onClick={onClose}>
            Close Drawer
          </button>
        </div>
      </aside>
    </div>
  );
}

export default TransactionDetailDrawer;

