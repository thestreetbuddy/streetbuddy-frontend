import { useState } from 'react';
import {
  Wallet,
  Coins,
  Receipt,
  Users,
  RotateCcw,
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Percent,
} from 'lucide-react';
import { formatINR } from '../../api/financialApi';

function FinancialSummaryCards({ summary = {}, loading = false }) {
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  const revenueSummary = summary?.revenue_summary || {};
  const razorpayCharges = summary?.razorpay_charges || {};
  const reconciliation = razorpayCharges?.reconciliation_breakdown || {};
  const userMetrics = summary?.user_and_transaction_metrics || {};
  const taxDetails = summary?.tax_details || {};

  const grossRevenue = revenueSummary.gross_revenue ?? 0;
  const netInHand = revenueSummary.net_in_hand_revenue ?? 0;
  const totalRefunds = revenueSummary.total_refunds ?? 0;
  const totalRazorpay = razorpayCharges.total_razorpay_charges_including_gst ?? 0;
  const baseFee = razorpayCharges.platform_fee_excluding_gst ?? 0;
  const gstOnFee = razorpayCharges.gst_on_platform_fee ?? 0;

  const uniquePayingUsers = userMetrics.unique_paying_users ?? 0;
  const successfulTxns = userMetrics.successful_transactions ?? 0;
  const totalTxns = userMetrics.total_transactions ?? 0;
  const successRate = totalTxns > 0 ? ((successfulTxns / totalTxns) * 100).toFixed(1) : 0;

  // Margin calculation (Net In-Hand % of Gross)
  const netMarginPct = grossRevenue > 0 ? ((netInHand / grossRevenue) * 100).toFixed(1) : '100.0';

  if (loading) {
    return (
      <div className="financial-kpi-grid">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="kpi-card kpi-skeleton">
            <div className="skeleton-icon" />
            <div className="skeleton-lines">
              <div className="skeleton-line short" />
              <div className="skeleton-line large" />
              <div className="skeleton-line medium" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="financial-summary-section">
      {/* Accounting Formula Banner */}
      <div className="accounting-formula-banner">
        <div className="formula-left">
          <div className="formula-icon-box">
            <Info size={18} />
          </div>
          <div className="formula-text">
            <strong>Accounting Formula:</strong>{' '}
            <span className="formula-expression">
              Net In-Hand = Gross Revenue − Razorpay Deductions (2% + 18% GST) − Refunds
            </span>
          </div>
        </div>
        <button
          type="button"
          className="formula-toggle-btn"
          onClick={() => setShowFormulaDetails((prev) => !prev)}
        >
          {showFormulaDetails ? 'Hide Example' : 'View Accounting Example'}
        </button>
      </div>

      {showFormulaDetails && (
        <div className="formula-example-drawer">
          <div className="example-grid">
            <div className="example-col">
              <span className="example-label">Customer Paid (Gross)</span>
              <strong className="example-val gross">₹199.00</strong>
            </div>
            <div className="example-operator">−</div>
            <div className="example-col">
              <span className="example-label">2% Platform Fee</span>
              <strong className="example-val fee">₹3.98</strong>
            </div>
            <div className="example-operator">+</div>
            <div className="example-col">
              <span className="example-label">18% GST on Fee</span>
              <strong className="example-val gst">₹0.72</strong>
            </div>
            <div className="example-operator">=</div>
            <div className="example-col highlight">
              <span className="example-label">Actual In-Hand Settlement</span>
              <strong className="example-val net">₹194.30 (97.6%)</strong>
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="financial-kpi-grid">
        {/* Card 1: Net In-Hand Revenue (Primary Highlight Card) */}
        <div className="kpi-card kpi-highlight-emerald">
          <div className="kpi-card-header">
            <div className="kpi-icon-wrapper emerald">
              <Wallet size={24} />
            </div>
            <span className="kpi-badge emerald">
              <Percent size={12} />
              {netMarginPct}% Net Yield
            </span>
          </div>

          <div className="kpi-card-body">
            <span className="kpi-label">💰 Net In-Hand Revenue</span>
            <strong className="kpi-value text-emerald">{formatINR(netInHand)}</strong>
            <p className="kpi-subtext">Actual Bank Settlement (After Gateway Fees)</p>
          </div>

          <div className="kpi-card-footer">
            <div className="footer-metric">
              <span className="metric-tag">Net Settlement:</span>
              <span className="metric-val">{formatINR(revenueSummary.net_settlement_amount ?? netInHand)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Gross Collections */}
        <div className="kpi-card kpi-blue">
          <div className="kpi-card-header">
            <div className="kpi-icon-wrapper blue">
              <Coins size={24} />
            </div>
            <span className="kpi-badge blue">Gross Collections</span>
          </div>

          <div className="kpi-card-body">
            <span className="kpi-label">Gross Revenue</span>
            <strong className="kpi-value text-blue">{formatINR(grossRevenue)}</strong>
            <p className="kpi-subtext">Total amount collected from customers</p>
          </div>

          <div className="kpi-card-footer">
            <div className="footer-metric">
              <span className="metric-tag">Customer GST:</span>
              <span className="metric-val">{formatINR(taxDetails.customer_gst_collected ?? 0)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Razorpay Platform Deductions */}
        <div className="kpi-card kpi-amber">
          <div className="kpi-card-header">
            <div className="kpi-icon-wrapper amber">
              <Receipt size={24} />
            </div>
            {reconciliation.status && (
              <span
                className={`kpi-badge ${
                  reconciliation.status === 'fully_verified'
                    ? 'emerald'
                    : reconciliation.status === 'partially_reconciled'
                    ? 'amber'
                    : 'neutral'
                }`}
              >
                {reconciliation.status === 'fully_verified' && <CheckCircle2 size={12} />}
                {reconciliation.status === 'partially_reconciled' && <AlertTriangle size={12} />}
                {reconciliation.status.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          <div className="kpi-card-body">
            <span className="kpi-label">Razorpay Deductions</span>
            <strong className="kpi-value text-amber">
              −{formatINR(totalRazorpay)}
            </strong>
            <p className="kpi-subtext">
              Base 2% fee ({formatINR(baseFee)}) + 18% GST ({formatINR(gstOnFee)})
            </p>
          </div>

          <div className="kpi-card-footer">
            <div className="footer-breakdown-row">
              <span>Base Fee: {formatINR(baseFee)}</span>
              <span className="dot">•</span>
              <span>GST: {formatINR(gstOnFee)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Unique Paying Users */}
        <div className="kpi-card kpi-purple">
          <div className="kpi-card-header">
            <div className="kpi-icon-wrapper purple">
              <Users size={24} />
            </div>
            <span className="kpi-badge purple">{successfulTxns} Successful</span>
          </div>

          <div className="kpi-card-body">
            <span className="kpi-label">Unique Paying Users</span>
            <strong className="kpi-value text-purple">
              {Number(uniquePayingUsers || 0).toLocaleString('en-IN')}
            </strong>
            <p className="kpi-subtext">
              {successRate}% txn success rate ({successfulTxns}/{totalTxns})
            </p>
          </div>

          <div className="kpi-card-footer">
            <div className="footer-metric">
              <span className="metric-tag">Total Orders:</span>
              <span className="metric-val">{totalTxns}</span>
            </div>
          </div>
        </div>

        {/* Card 5: Total Refunds */}
        <div className={`kpi-card ${totalRefunds > 0 ? 'kpi-rose' : 'kpi-neutral'}`}>
          <div className="kpi-card-header">
            <div className={`kpi-icon-wrapper ${totalRefunds > 0 ? 'rose' : 'neutral'}`}>
              <RotateCcw size={24} />
            </div>
            {totalRefunds > 0 ? (
              <span className="kpi-badge rose">Refunds Issued</span>
            ) : (
              <span className="kpi-badge neutral">0 Refunds</span>
            )}
          </div>

          <div className="kpi-card-body">
            <span className="kpi-label">Total Refunds</span>
            <strong className={`kpi-value ${totalRefunds > 0 ? 'text-rose' : 'text-neutral'}`}>
              {formatINR(totalRefunds)}
            </strong>
            <p className="kpi-subtext">
              {userMetrics.refunded_transactions ?? 0} refunded transactions
            </p>
          </div>

          <div className="kpi-card-footer">
            <div className="footer-metric">
              <span className="metric-tag">Partial Refunds:</span>
              <span className="metric-val">{userMetrics.partially_refunded_transactions ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinancialSummaryCards;

