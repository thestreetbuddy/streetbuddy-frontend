import {
  Users,
  Eye,
  Clock,
  UserCheck,
  TrendingUp,
  Percent,
  Sparkles,
} from 'lucide-react';

function VisitorMetricCards({ summary = {}, loading = false }) {
  const totalUnique = summary.totalUniqueVisitors ?? 0;
  const totalVisits = summary.totalVisits ?? 0;
  const avgVisits = summary.avgVisitsPerUser ?? (totalUnique > 0 ? (totalVisits / totalUnique).toFixed(1) : 1);
  const newVisitors = summary.newVisitors ?? 0;
  const returningVisitors = summary.returningVisitors ?? 0;
  const newPct = summary.newVisitorsPercentage ?? (totalUnique > 0 ? ((newVisitors / totalUnique) * 100).toFixed(1) : 0);
  const retPct = summary.returningVisitorsPercentage ?? (totalUnique > 0 ? ((returningVisitors / totalUnique) * 100).toFixed(1) : 0);

  const avgDurationText = summary.avgActiveDurationText || (summary.avgActiveDurationSeconds ? `${Math.round(summary.avgActiveDurationSeconds / 60)}m` : '0m 00s');
  const maxDurationText = summary.maxActiveDurationText || '—';

  if (loading) {
    return (
      <div className="visitor-kpi-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="visitor-kpi-card skeleton-card">
            <div className="skeleton-icon-box" />
            <div className="skeleton-body">
              <div className="skeleton-line-sm" />
              <div className="skeleton-line-lg" />
              <div className="skeleton-line-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="visitor-kpi-grid">
      {/* 1. Unique Visitors */}
      <div className="visitor-kpi-card card-blue">
        <div className="kpi-top-row">
          <div className="kpi-icon-wrap blue">
            <Users size={22} />
          </div>
          <div className="kpi-ratio-pill">
            <span className="ratio-new">{newPct}% New</span>
            <span className="ratio-divider">•</span>
            <span className="ratio-ret">{retPct}% Return</span>
          </div>
        </div>

        <div className="kpi-center-body">
          <span className="kpi-title">Unique Visitors</span>
          <strong className="kpi-number text-blue">
            {Number(totalUnique || 0).toLocaleString('en-IN')}
          </strong>
        </div>

        <div className="kpi-bottom-footer">
          <div className="user-split-bar">
            <div
              className="split-fill new"
              style={{ width: `${Math.min(Math.max(newPct, 5), 95)}%` }}
              title={`New: ${newVisitors}`}
            />
            <div
              className="split-fill returning"
              style={{ width: `${Math.min(Math.max(retPct, 5), 95)}%` }}
              title={`Returning: ${returningVisitors}`}
            />
          </div>
          <span className="footer-subtext">
            {newVisitors} First-time & {returningVisitors} Returning Users
          </span>
        </div>
      </div>

      {/* 2. Total Page Visits */}
      <div className="visitor-kpi-card card-emerald">
        <div className="kpi-top-row">
          <div className="kpi-icon-wrap emerald">
            <Eye size={22} />
          </div>
          <span className="kpi-badge emerald">
            <TrendingUp size={12} />
            {avgVisits}x Frequency
          </span>
        </div>

        <div className="kpi-center-body">
          <span className="kpi-title">Total Page Visits</span>
          <strong className="kpi-number text-emerald">
            {Number(totalVisits || 0).toLocaleString('en-IN')}
          </strong>
        </div>

        <div className="kpi-bottom-footer">
          <span className="footer-subtext">
            Average <strong>{avgVisits}</strong> page hits per unique visitor
          </span>
        </div>
      </div>

      {/* 3. Avg Active Time on Site */}
      <div className="visitor-kpi-card card-purple">
        <div className="kpi-top-row">
          <div className="kpi-icon-wrap purple">
            <Clock size={22} />
          </div>
          <span className="kpi-badge purple">
            <Sparkles size={12} />
            Live Session
          </span>
        </div>

        <div className="kpi-center-body">
          <span className="kpi-title">Avg Active Time on Site</span>
          <strong className="kpi-number text-purple">{avgDurationText}</strong>
        </div>

        <div className="kpi-bottom-footer">
          <span className="footer-subtext">
            Peak user session: <strong>{maxDurationText}</strong>
          </span>
        </div>
      </div>

      {/* 4. Returning Visitors */}
      <div className="visitor-kpi-card card-amber">
        <div className="kpi-top-row">
          <div className="kpi-icon-wrap amber">
            <UserCheck size={22} />
          </div>
          <span className="kpi-badge amber">
            <Percent size={12} />
            {retPct}% Retention
          </span>
        </div>

        <div className="kpi-center-body">
          <span className="kpi-title">Returning Visitors</span>
          <strong className="kpi-number text-amber">
            {Number(returningVisitors || 0).toLocaleString('en-IN')}
          </strong>
        </div>

        <div className="kpi-bottom-footer">
          <span className="footer-subtext">
            {retPct}% retention of daily website traffic
          </span>
        </div>
      </div>
    </div>
  );
}

export default VisitorMetricCards;

