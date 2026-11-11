import { useState, useMemo, useRef } from 'react';
import {
  TrendingUp,
  Calendar,
  Sparkles,
  Eye,
  EyeOff,
  Layers,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { formatChartDate } from '../../api/visitorAnalyticsApi';

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

function VisitorTrafficChart({
  dailyTrends = [],
  topPages = [],
  loading = false,
}) {
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' | 'pages'
  const [showUnique, setShowUnique] = useState(true);
  const [showVisits, setShowVisits] = useState(true);
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);

  // SVG canvas dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 25, right: 30, bottom: 45, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Process data points and bounds
  const {
    uniquePoints,
    visitsPoints,
    maxVal,
    peakVisitors,
    peakVisits,
  } = useMemo(() => {
    if (!dailyTrends || dailyTrends.length === 0) {
      return {
        uniquePoints: [],
        visitsPoints: [],
        maxVal: 100,
        peakVisitors: 0,
        peakVisits: 0,
      };
    }

    const uVals = dailyTrends.map((d) => Number(d.uniqueVisitors) || 0);
    const vVals = dailyTrends.map((d) => Number(d.totalVisits) || 0);
    const highest = Math.max(...uVals, ...vVals, 10);
    const roundedMax = Math.ceil(highest * 1.18);

    const stepX = dailyTrends.length > 1 ? chartWidth / (dailyTrends.length - 1) : chartWidth / 2;

    const uPts = dailyTrends.map((item, idx) => {
      const val = Number(item.uniqueVisitors) || 0;
      const x = padding.left + (dailyTrends.length === 1 ? chartWidth / 2 : idx * stepX);
      const y = padding.top + chartHeight - (val / (roundedMax || 1)) * chartHeight;
      return { x, y, val, raw: item };
    });

    const vPts = dailyTrends.map((item, idx) => {
      const val = Number(item.totalVisits) || 0;
      const x = padding.left + (dailyTrends.length === 1 ? chartWidth / 2 : idx * stepX);
      const y = padding.top + chartHeight - (val / (roundedMax || 1)) * chartHeight;
      return { x, y, val, raw: item };
    });

    return {
      uniquePoints: uPts,
      visitsPoints: vPts,
      maxVal: roundedMax,
      peakVisitors: Math.max(...uVals, 0),
      peakVisits: Math.max(...vVals, 0),
    };
  }, [dailyTrends, chartWidth, chartHeight, padding.left, padding.top]);

  const uniqueLinePath = useMemo(() => getSmoothPath(uniquePoints), [uniquePoints]);
  const visitsLinePath = useMemo(() => getSmoothPath(visitsPoints), [visitsPoints]);

  const uniqueAreaPath = useMemo(() => {
    if (uniquePoints.length === 0) return '';
    const first = uniquePoints[0];
    const last = uniquePoints[uniquePoints.length - 1];
    const baselineY = padding.top + chartHeight;
    return `${uniqueLinePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }, [uniquePoints, uniqueLinePath, chartHeight, padding.top]);

  const visitsAreaPath = useMemo(() => {
    if (visitsPoints.length === 0) return '';
    const first = visitsPoints[0];
    const last = visitsPoints[visitsPoints.length - 1];
    const baselineY = padding.top + chartHeight;
    return `${visitsLinePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }, [visitsPoints, visitsLinePath, chartHeight, padding.top]);

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
    if (!svgRef.current || uniquePoints.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;

    let closestIdx = 0;
    let minDistance = Infinity;

    uniquePoints.forEach((pt, idx) => {
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

  const hoveredUnique = hoverIndex !== null ? uniquePoints[hoverIndex] : null;
  const hoveredVisits = hoverIndex !== null ? visitsPoints[hoverIndex] : null;

  // Compute top pages total visits for bar percentages
  const maxPageVisits = useMemo(() => {
    if (!topPages || topPages.length === 0) return 1;
    return Math.max(...topPages.map((p) => p.visits || 0), 1);
  }, [topPages]);

  return (
    <div className="visitor-chart-card">
      {/* Header with Title and Mode Switcher */}
      <div className="visitor-chart-header">
        <div className="header-title-box">
          <div className="chart-icon-cube">
            {activeTab === 'chart' ? <TrendingUp size={20} /> : <FileText size={20} />}
          </div>
          <div>
            <h3 className="chart-main-title">
              {activeTab === 'chart' ? 'Daily Website Traffic Trajectory' : 'Top Visited Landing Pages'}
            </h3>
            <p className="chart-subtitle">
              {activeTab === 'chart'
                ? 'Unique Visitors vs. Total Page Impressions over time'
                : 'Most frequently hit URLs and route paths'}
            </p>
          </div>
        </div>

        <div className="header-actions-group">
          {/* Tab Selector */}
          <div className="tab-pill-group">
            <button
              type="button"
              className={`tab-pill-btn ${activeTab === 'chart' ? 'active' : ''}`}
              onClick={() => setActiveTab('chart')}
            >
              <TrendingUp size={14} />
              <span>Trends</span>
            </button>
            <button
              type="button"
              className={`tab-pill-btn ${activeTab === 'pages' ? 'active' : ''}`}
              onClick={() => setActiveTab('pages')}
            >
              <FileText size={14} />
              <span>Top Pages ({topPages.length})</span>
            </button>
          </div>

          {/* Series Toggles (in chart mode) */}
          {activeTab === 'chart' && (
            <div className="series-toggles-wrap">
              <button
                type="button"
                className={`legend-toggle-pill blue ${showUnique ? 'active' : 'dimmed'}`}
                onClick={() => setShowUnique((prev) => !prev)}
              >
                <span className="pill-dot blue" />
                <span>Unique Visitors</span>
                {showUnique ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>

              <button
                type="button"
                className={`legend-toggle-pill emerald ${showVisits ? 'active' : 'dimmed'}`}
                onClick={() => setShowVisits((prev) => !prev)}
              >
                <span className="pill-dot emerald" />
                <span>Total Visits</span>
                {showVisits ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body: Chart Mode */}
      {activeTab === 'chart' && (
        <div className="chart-body-wrapper">
          {/* Quick Stats Strip */}
          <div className="trend-stats-strip">
            <div className="stat-chip">
              <span className="chip-label">Peak Daily Visitors:</span>
              <strong className="chip-val text-blue">
                {peakVisitors.toLocaleString('en-IN')}
              </strong>
            </div>
            <div className="chip-divider" />
            <div className="stat-chip">
              <span className="chip-label">Peak Total Impressions:</span>
              <strong className="chip-val text-emerald">
                {peakVisits.toLocaleString('en-IN')}
              </strong>
            </div>
            <div className="chip-divider" />
            <div className="stat-chip">
              <span className="chip-label">Recorded Days:</span>
              <strong className="chip-val text-purple">{dailyTrends.length} Days</strong>
            </div>
          </div>

          <div className="svg-canvas-box" onMouseLeave={handleMouseLeave}>
            {loading ? (
              <div className="chart-loading-state">
                <div className="spinner-ring" />
                <span>Loading traffic trajectory...</span>
              </div>
            ) : dailyTrends.length === 0 ? (
              <div className="chart-empty-state">
                <Sparkles size={28} />
                <p>No traffic recorded for this selected date filter.</p>
              </div>
            ) : (
              <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                className="traffic-svg"
                onMouseMove={handleMouseMove}
              >
                <defs>
                  {/* Blue gradient for Unique Visitors */}
                  <linearGradient id="uniqueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.32" />
                    <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.06" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Emerald gradient for Total Visits */}
                  <linearGradient id="visitsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                    <stop offset="70%" stopColor="#10b981" stopOpacity="0.06" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>

                  <filter id="svgGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.2" />
                  </filter>
                </defs>

                {/* Horizontal Grid lines */}
                {yTicks.map((tick, i) => (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={tick.y}
                      x2={width - padding.right}
                      y2={tick.y}
                      stroke="#f1f5f9"
                      strokeDasharray="4 4"
                      strokeWidth="1.2"
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
                      {tick.val >= 1000 ? `${(tick.val / 1000).toFixed(1)}k` : tick.val}
                    </text>
                  </g>
                ))}

                {/* Area Fills */}
                {showVisits && visitsAreaPath && (
                  <path d={visitsAreaPath} fill="url(#visitsAreaGrad)" />
                )}
                {showUnique && uniqueAreaPath && (
                  <path d={uniqueAreaPath} fill="url(#uniqueAreaGrad)" />
                )}

                {/* Lines */}
                {showVisits && visitsLinePath && (
                  <path
                    d={visitsLinePath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#svgGlow)"
                  />
                )}
                {showUnique && uniqueLinePath && (
                  <path
                    d={uniqueLinePath}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#svgGlow)"
                  />
                )}

                {/* Data Points if few records */}
                {dailyTrends.length <= 14 && (
                  <>
                    {showVisits &&
                      visitsPoints.map((pt, i) => (
                        <circle
                          key={`v-pt-${i}`}
                          cx={pt.x}
                          cy={pt.y}
                          r="4"
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      ))}
                    {showUnique &&
                      uniquePoints.map((pt, i) => (
                        <circle
                          key={`u-pt-${i}`}
                          cx={pt.x}
                          cy={pt.y}
                          r="4"
                          fill="#3b82f6"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      ))}
                  </>
                )}

                {/* X-Axis Dates */}
                {uniquePoints.map((pt, idx) => {
                  const shouldShow =
                    dailyTrends.length <= 8 ||
                    idx === 0 ||
                    idx === dailyTrends.length - 1 ||
                    idx % Math.ceil(dailyTrends.length / 6) === 0;

                  if (!shouldShow) return null;

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
                      {formatChartDate(pt.raw?.date)}
                    </text>
                  );
                })}

                {/* Hover line & marker */}
                {hoveredUnique && (
                  <g>
                    <line
                      x1={hoveredUnique.x}
                      y1={padding.top}
                      x2={hoveredUnique.x}
                      y2={height - padding.bottom}
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />

                    {showUnique && (
                      <circle
                        cx={hoveredUnique.x}
                        cy={hoveredUnique.y}
                        r="6.5"
                        fill="#3b82f6"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                      />
                    )}

                    {showVisits && hoveredVisits && (
                      <circle
                        cx={hoveredVisits.x}
                        cy={hoveredVisits.y}
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

            {/* Floating Tooltip */}
            {hoveredUnique && hoveredVisits && (
              <div
                className="traffic-chart-tooltip"
                style={{
                  left: `${Math.min(Math.max(hoveredUnique.x, 90), width - 150)}px`,
                  top: `${Math.max(Math.min(hoveredUnique.y, hoveredVisits.y) - 80, 10)}px`,
                }}
              >
                <div className="tooltip-date-header">
                  <Calendar size={12} />
                  <span>{formatChartDate(hoveredUnique.raw?.date)}</span>
                </div>

                <div className="tooltip-line">
                  <span className="dot blue" />
                  <span className="lbl">Unique Visitors:</span>
                  <strong className="val blue">{hoveredUnique.val.toLocaleString()}</strong>
                </div>

                <div className="tooltip-line">
                  <span className="dot emerald" />
                  <span className="lbl">Total Visits:</span>
                  <strong className="val emerald">{hoveredVisits.val.toLocaleString()}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Body: Top Visited Pages Mode */}
      {activeTab === 'pages' && (
        <div className="top-pages-list-wrap">
          {topPages.length === 0 ? (
            <div className="empty-pages-notice">
              <FileText size={24} />
              <span>No page visit details logged for this period.</span>
            </div>
          ) : (
            <div className="pages-table-wrapper">
              <table className="pages-table">
                <thead>
                  <tr>
                    <th className="th-rank">#</th>
                    <th className="th-path">Landing Page Route</th>
                    <th className="th-bar">Visit Volume Share</th>
                    <th className="th-count text-right">Total Hits</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.map((page, idx) => {
                    const percentage = Math.round(((page.visits || 0) / maxPageVisits) * 100);
                    return (
                      <tr key={page.path || idx}>
                        <td className="td-rank">
                          <span className={`rank-badge ${idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : ''}`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="td-path">
                          <div className="path-cell">
                            <span className="path-text">{page.path}</span>
                            <span className="path-tag">
                              {page.path === '/' ? 'Home Page' : page.path.replace('/', '')}
                            </span>
                          </div>
                        </td>
                        <td className="td-bar">
                          <div className="volume-track">
                            <div
                              className="volume-fill"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </td>
                        <td className="td-count text-right">
                          <strong className="page-hits-num">
                            {(page.visits || 0).toLocaleString('en-IN')}
                          </strong>
                          <span className="hits-unit">visits</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VisitorTrafficChart;

