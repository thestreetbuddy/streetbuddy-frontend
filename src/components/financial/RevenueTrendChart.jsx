import { useState, useMemo, useRef } from 'react';
import {
  TrendingUp,
  Calendar,
  Sparkles,
  Eye,
  EyeOff,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { formatINR, formatISTDateOnly } from '../../api/financialApi';

/**
 * Bézier curve calculation for smooth SVG path
 */
function getSmoothPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const cp1x = current.x + (next.x - current.x) / 2;
    const cp1y = current.y;
    const cp2x = current.x + (next.x - current.x) / 2;
    const cp2y = next.y;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }
  return path;
}

function RevenueTrendChart({
  series = [],
  interval = 'day',
  onIntervalChange,
  loading = false,
}) {
  const [showGross, setShowGross] = useState(true);
  const [showNet, setShowNet] = useState(true);
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);

  // SVG canvas dimensions
  const width = 860;
  const height = 340;
  const padding = { top: 30, right: 35, bottom: 45, left: 75 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Process data points and bounds
  const {
    grossPoints,
    netPoints,
    maxVal,
    peakGross,
    peakNet,
    totalGrossSum,
    totalNetSum,
  } = useMemo(() => {
    if (!series || series.length === 0) {
      return {
        grossPoints: [],
        netPoints: [],
        maxVal: 1000,
        peakGross: 0,
        peakNet: 0,
        totalGrossSum: 0,
        totalNetSum: 0,
      };
    }

    const grossVals = series.map((s) => Number(s.gross_revenue) || 0);
    const netVals = series.map((s) => Number(s.net_in_hand_revenue) || 0);

    const highest = Math.max(...grossVals, ...netVals, 100);
    // Add 15% headroom for top margin
    const roundedMax = Math.ceil(highest * 1.15);

    const stepX = series.length > 1 ? chartWidth / (series.length - 1) : chartWidth / 2;

    const gPoints = series.map((item, idx) => {
      const val = Number(item.gross_revenue) || 0;
      const x = padding.left + idx * stepX;
      const y = padding.top + chartHeight - (val / (roundedMax || 1)) * chartHeight;
      return { x, y, val, raw: item };
    });

    const nPoints = series.map((item, idx) => {
      const val = Number(item.net_in_hand_revenue) || 0;
      const x = padding.left + idx * stepX;
      const y = padding.top + chartHeight - (val / (roundedMax || 1)) * chartHeight;
      return { x, y, val, raw: item };
    });

    return {
      grossPoints: gPoints,
      netPoints: nPoints,
      maxVal: roundedMax,
      peakGross: Math.max(...grossVals, 0),
      peakNet: Math.max(...netVals, 0),
      totalGrossSum: grossVals.reduce((a, b) => a + b, 0),
      totalNetSum: netVals.reduce((a, b) => a + b, 0),
    };
  }, [series, chartWidth, chartHeight, padding.left, padding.top]);

  // Curve paths
  const grossLinePath = useMemo(() => getSmoothPath(grossPoints), [grossPoints]);
  const netLinePath = useMemo(() => getSmoothPath(netPoints), [netPoints]);

  const grossAreaPath = useMemo(() => {
    if (grossPoints.length === 0) return '';
    const first = grossPoints[0];
    const last = grossPoints[grossPoints.length - 1];
    const baselineY = padding.top + chartHeight;
    return `${grossLinePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }, [grossPoints, grossLinePath, chartHeight, padding.top]);

  const netAreaPath = useMemo(() => {
    if (netPoints.length === 0) return '';
    const first = netPoints[0];
    const last = netPoints[netPoints.length - 1];
    const baselineY = padding.top + chartHeight;
    return `${netLinePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }, [netPoints, netLinePath, chartHeight, padding.top]);

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const ticksCount = 4;
    const step = maxVal / ticksCount;
    return Array.from({ length: ticksCount + 1 }, (_, i) => {
      const val = Math.round(i * step);
      const y = padding.top + chartHeight - (i / ticksCount) * chartHeight;
      return { val, y };
    });
  }, [maxVal, chartHeight, padding.top]);

  // Mouse hover tracking
  const handleMouseMove = (e) => {
    if (!svgRef.current || grossPoints.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;

    let closestIdx = 0;
    let minDistance = Infinity;

    grossPoints.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - mouseX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    setHoverIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const hoveredGross = hoverIndex !== null ? grossPoints[hoverIndex] : null;
  const hoveredNet = hoverIndex !== null ? netPoints[hoverIndex] : null;

  return (
    <div className="financial-chart-container">
      {/* Chart Header Bar */}
      <div className="financial-chart-header">
        <div className="chart-header-left">
          <div className="chart-header-icon-box">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="financial-chart-title">Revenue Trajectory & In-Hand Trend</h3>
            <p className="financial-chart-subtitle">
              Comparison between Gross Customer Collections vs. Net Bank Settlement
            </p>
          </div>
        </div>

        <div className="chart-header-right">
          {/* Interval Toggle (Daily vs Monthly) */}
          <div className="interval-toggle-group">
            <button
              type="button"
              className={`interval-pill ${interval === 'day' ? 'active' : ''}`}
              onClick={() => onIntervalChange && onIntervalChange('day')}
            >
              Daily View
            </button>
            <button
              type="button"
              className={`interval-pill ${interval === 'month' ? 'active' : ''}`}
              onClick={() => onIntervalChange && onIntervalChange('month')}
            >
              Monthly View
            </button>
          </div>

          {/* Series Toggle Controls */}
          <div className="series-toggles">
            <button
              type="button"
              className={`series-toggle-pill blue ${showGross ? 'active' : 'inactive'}`}
              onClick={() => setShowGross((prev) => !prev)}
              title="Toggle Gross Revenue line"
            >
              <span className="series-color-dot blue" />
              <span>Gross Revenue</span>
              {showGross ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>

            <button
              type="button"
              className={`series-toggle-pill emerald ${showNet ? 'active' : 'inactive'}`}
              onClick={() => setShowNet((prev) => !prev)}
              title="Toggle Net In-Hand Revenue line"
            >
              <span className="series-color-dot emerald" />
              <span>Net In-Hand</span>
              {showNet ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip inside Chart */}
      <div className="chart-summary-strip">
        <div className="strip-item">
          <span className="strip-label">Peak Gross Day:</span>
          <strong className="strip-val text-blue">{formatINR(peakGross)}</strong>
        </div>
        <div className="strip-divider" />
        <div className="strip-item">
          <span className="strip-label">Peak In-Hand Day:</span>
          <strong className="strip-val text-emerald">{formatINR(peakNet)}</strong>
        </div>
        <div className="strip-divider" />
        <div className="strip-item">
          <span className="strip-label">Net Retention Rate:</span>
          <strong className="strip-val text-purple">
            {totalGrossSum > 0 ? ((totalNetSum / totalGrossSum) * 100).toFixed(1) : '100.0'}%
          </strong>
        </div>
      </div>

      {/* Interactive Chart Canvas */}
      <div className="chart-canvas-container" onMouseLeave={handleMouseLeave}>
        {loading ? (
          <div className="chart-loading-state">
            <div className="chart-pulse-ring" />
            <span>Calculating financial revenue trends...</span>
          </div>
        ) : series.length === 0 ? (
          <div className="chart-empty-state">
            <Sparkles size={32} />
            <h4>No revenue records found for this period</h4>
            <p>Try switching to another time period or date range from the top filter.</p>
          </div>
        ) : (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="revenue-svg"
            onMouseMove={handleMouseMove}
          >
            <defs>
              {/* Gross Revenue (Blue) Gradient */}
              <linearGradient id="grossGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>

              {/* Net In-Hand (Emerald) Gradient */}
              <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#10b981" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>

              {/* Drop Shadow Filter */}
              <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Horizontal Grid lines and Y labels */}
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={tick.y}
                  x2={width - padding.right}
                  y2={tick.y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 12}
                  y={tick.y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="Inter, sans-serif"
                >
                  ₹{tick.val >= 1000 ? `${(tick.val / 1000).toFixed(1)}k` : tick.val}
                </text>
              </g>
            ))}

            {/* Area Fills */}
            {showGross && grossAreaPath && (
              <path d={grossAreaPath} fill="url(#grossGradient)" />
            )}
            {showNet && netAreaPath && (
              <path d={netAreaPath} fill="url(#netGradient)" />
            )}

            {/* Lines */}
            {showGross && grossLinePath && (
              <path
                d={grossLinePath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#lineGlow)"
              />
            )}
            {showNet && netLinePath && (
              <path
                d={netLinePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#lineGlow)"
              />
            )}

            {/* X-Axis Dates */}
            {grossPoints.map((pt, idx) => {
              // Show label if reasonable count or at intervals
              const shouldShowLabel =
                series.length <= 10 ||
                idx === 0 ||
                idx === series.length - 1 ||
                idx % Math.ceil(series.length / 7) === 0;

              if (!shouldShowLabel) return null;

              const dateText = pt.raw?.date
                ? formatISTDateOnly(pt.raw.date)
                : `Day ${idx + 1}`;

              return (
                <text
                  key={idx}
                  x={pt.x}
                  y={height - padding.bottom + 22}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="11"
                  fontWeight="500"
                  fontFamily="Inter, sans-serif"
                >
                  {dateText}
                </text>
              );
            })}

            {/* Hover guideline and markers */}
            {hoveredGross && (
              <g>
                <line
                  x1={hoveredGross.x}
                  y1={padding.top}
                  x2={hoveredGross.x}
                  y2={height - padding.bottom}
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {showGross && (
                  <circle
                    cx={hoveredGross.x}
                    cy={hoveredGross.y}
                    r="6"
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />
                )}

                {showNet && hoveredNet && (
                  <circle
                    cx={hoveredNet.x}
                    cy={hoveredNet.y}
                    r="6.5"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />
                )}
              </g>
            )}
          </svg>
        )}

        {/* Floating Tooltip Box */}
        {hoveredGross && hoveredNet && (
          <div
            className="chart-tooltip"
            style={{
              left: `${Math.min(Math.max(hoveredGross.x, 110), width - 180)}px`,
              top: `${Math.max(hoveredNet.y - 120, 10)}px`,
            }}
          >
            <div className="tooltip-date">
              <Calendar size={13} />
              <span>
                {hoveredGross.raw?.date
                  ? formatISTDateOnly(hoveredGross.raw.date)
                  : 'Date'}
              </span>
            </div>

            <div className="tooltip-row">
              <span className="tooltip-dot blue" />
              <span className="tooltip-label">Gross Revenue:</span>
              <strong className="tooltip-val blue">
                {formatINR(hoveredGross.val)}
              </strong>
            </div>

            <div className="tooltip-row">
              <span className="tooltip-dot emerald" />
              <span className="tooltip-label">Net In-Hand:</span>
              <strong className="tooltip-val emerald">
                {formatINR(hoveredNet.val)}
              </strong>
            </div>

            <div className="tooltip-footer">
              <span>Gateway Deduction:</span>
              <strong>
                −{formatINR(Math.max(0, hoveredGross.val - hoveredNet.val))}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RevenueTrendChart;

