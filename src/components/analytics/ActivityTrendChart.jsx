import { useState, useMemo, useRef } from 'react';
import {
  Users,
  Clock,
  Layers,
  Calendar,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

/**
 * Helper to compute smooth Bézier curve control points for an SVG path
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

const METRICS = [
  {
    id: 'activeUsers',
    label: 'Active Users',
    icon: Users,
    color: '#ff7a2f',
    gradientId: 'gradient-users',
    unit: ' users',
    format: (val) => `${Number(val || 0).toLocaleString()} users`,
  },
  {
    id: 'totalDurationMinutes',
    label: 'Total Screen Time',
    icon: Clock,
    color: '#8b5cf6',
    gradientId: 'gradient-duration',
    unit: ' mins',
    format: (val) => {
      const mins = Number(val || 0);
      if (mins < 60) return `${mins.toFixed(0)}m`;
      const hrs = Math.floor(mins / 60);
      const remMins = Math.round(mins % 60);
      return `${hrs}h ${remMins}m`;
    },
  },
  {
    id: 'totalSessions',
    label: 'Total Sessions',
    icon: Layers,
    color: '#10b981',
    gradientId: 'gradient-sessions',
    unit: ' sessions',
    format: (val) => `${Number(val || 0).toLocaleString()} sessions`,
  },
];

function ActivityTrendChart({ data = [], days = 7, onDaysChange, loading = false }) {
  const [selectedMetric, setSelectedMetric] = useState('activeUsers');
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);

  const activeMetricConfig = useMemo(
    () => METRICS.find((m) => m.id === selectedMetric) || METRICS[0],
    [selectedMetric]
  );

  // SVG dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 25, right: 30, bottom: 45, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Process data points
  const { chartPoints, maxValue, minValue, summaryStats } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        chartPoints: [],
        maxValue: 100,
        minValue: 0,
        summaryStats: { peak: 0, avg: 0, total: 0 },
      };
    }

    const values = data.map((d) => Number(d[selectedMetric]) || 0);
    const max = Math.max(...values, 10);
    const min = 0;
    // Add 10% headroom
    const roundedMax = Math.ceil(max * 1.15);

    const stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth / 2;

    const points = data.map((item, index) => {
      const val = Number(item[selectedMetric]) || 0;
      const x = padding.left + index * stepX;
      const y =
        padding.top +
        chartHeight -
        ((val - min) / (roundedMax - min || 1)) * chartHeight;
      return { x, y, val, raw: item };
    });

    const sum = values.reduce((acc, curr) => acc + curr, 0);
    const avg = values.length > 0 ? (sum / values.length).toFixed(1) : 0;
    const peak = Math.max(...values, 0);

    return {
      chartPoints: points,
      maxValue: roundedMax,
      minValue: 0,
      summaryStats: { peak, avg, total: sum },
    };
  }, [data, selectedMetric, chartWidth, chartHeight, padding.left, padding.top]);

  // Construct line and area paths
  const linePath = useMemo(() => getSmoothPath(chartPoints), [chartPoints]);

  const areaPath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    const firstPoint = chartPoints[0];
    const lastPoint = chartPoints[chartPoints.length - 1];
    const baselineY = padding.top + chartHeight;
    return `${linePath} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`;
  }, [chartPoints, linePath, chartHeight, padding.top]);

  // Grid line values
  const yTicks = useMemo(() => {
    const ticksCount = 4;
    const step = maxValue / ticksCount;
    return Array.from({ length: ticksCount + 1 }, (_, i) => {
      const val = Math.round(i * step);
      const y = padding.top + chartHeight - (i / ticksCount) * chartHeight;
      return { val, y };
    });
  }, [maxValue, chartHeight, padding.top]);

  // Handle mouse move on SVG
  const handleMouseMove = (e) => {
    if (!svgRef.current || chartPoints.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;

    // Find closest point
    let closestIdx = 0;
    let minDistance = Infinity;

    chartPoints.forEach((pt, idx) => {
      const distance = Math.abs(pt.x - mouseX);
      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = idx;
      }
    });

    setHoverIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const hoveredData = hoverIndex !== null ? chartPoints[hoverIndex] : null;

  return (
    <div className="activity-chart-container">
      {/* Chart Header */}
      <div className="chart-header">
        <div className="chart-title-group">
          <div className="chart-icon-box">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="chart-title">Activity Trends & Engagement</h3>
            <p className="chart-subtitle">
              Daily trajectory of active users, session frequency, and engagement time
            </p>
          </div>
        </div>

        {/* Controls: Metric Switcher & Days Range */}
        <div className="chart-controls">
          <div className="metric-pills">
            {METRICS.map((metric) => {
              const Icon = metric.icon;
              const isActive = selectedMetric === metric.id;
              return (
                <button
                  key={metric.id}
                  type="button"
                  className={`metric-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedMetric(metric.id)}
                >
                  <Icon size={15} />
                  <span>{metric.label}</span>
                </button>
              );
            })}
          </div>

          <div className="days-selector">
            <Calendar size={14} className="calendar-icon" />
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                className={`days-pill ${days === d ? 'active' : ''}`}
                onClick={() => onDaysChange && onDaysChange(d)}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="chart-canvas-wrapper" onMouseLeave={handleMouseLeave}>
        {loading ? (
          <div className="chart-loading-state">
            <div className="chart-pulse-ring" />
            <span>Updating activity trajectory...</span>
          </div>
        ) : chartPoints.length === 0 ? (
          <div className="chart-empty-state">
            <Sparkles size={28} />
            <p>No activity trends recorded for this period.</p>
          </div>
        ) : (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="activity-svg"
            onMouseMove={handleMouseMove}
          >
            <defs>
              {/* Gradients for each metric */}
              <linearGradient id="gradient-users" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff7a2f" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#ff7a2f" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#ff7a2f" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="gradient-duration" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="gradient-sessions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#10b981" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>

              <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={activeMetricConfig.color} floodOpacity="0.3" />
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
                  stroke="rgba(32, 27, 23, 0.07)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 12}
                  y={tick.y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#94a3b8"
                  fontWeight="500"
                >
                  {tick.val >= 1000 ? `${(tick.val / 1000).toFixed(1)}k` : tick.val}
                </text>
              </g>
            ))}

            {/* Gradient Area Fill */}
            <path
              d={areaPath}
              fill={`url(#${activeMetricConfig.gradientId})`}
              className="chart-area-path"
            />

            {/* Main Smooth Line */}
            <path
              d={linePath}
              fill="none"
              stroke={activeMetricConfig.color}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow-effect)"
              className="chart-line-path"
            />

            {/* X-axis date labels */}
            {chartPoints.map((pt, i) => {
              // Show label conditionally to avoid crowding if many points
              const stepInterval = days > 14 ? 3 : days > 7 ? 2 : 1;
              const shouldShowLabel = i % stepInterval === 0 || i === chartPoints.length - 1;
              if (!shouldShowLabel) return null;

              const dateStr = pt.raw.date;
              let label = dateStr;
              try {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                  const d = new Date(dateStr);
                  label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
              } catch {
                label = dateStr;
              }

              return (
                <text
                  key={i}
                  x={pt.x}
                  y={height - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#64748b"
                  fontWeight="500"
                >
                  {label}
                </text>
              );
            })}

            {/* Data Point Dots */}
            {chartPoints.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={hoverIndex === i ? 6 : 3.5}
                fill={hoverIndex === i ? '#ffffff' : activeMetricConfig.color}
                stroke={activeMetricConfig.color}
                strokeWidth={hoverIndex === i ? 3 : 2}
                className="chart-dot"
                style={{ transition: 'all 0.2s ease' }}
              />
            ))}

            {/* Interactive Vertical Cursor Line */}
            {hoveredData && (
              <g pointerEvents="none">
                <line
                  x1={hoveredData.x}
                  y1={padding.top}
                  x2={hoveredData.x}
                  y2={padding.top + chartHeight}
                  stroke={activeMetricConfig.color}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.85"
                />
                <circle
                  cx={hoveredData.x}
                  cy={hoveredData.y}
                  r="7"
                  fill="#ffffff"
                  stroke={activeMetricConfig.color}
                  strokeWidth="3"
                  filter="url(#glow-effect)"
                />
              </g>
            )}
          </svg>
        )}

        {/* Floating Tooltip Box */}
        {hoveredData && (
          <div
            className="chart-floating-tooltip"
            style={{
              left: `${(hoveredData.x / width) * 100}%`,
              top: `${Math.max(10, (hoveredData.y / height) * 100 - 35)}%`,
            }}
          >
            <div className="tooltip-date">
              {new Date(hoveredData.raw.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
            <div className="tooltip-metric">
              <span className="tooltip-color-dot" style={{ background: activeMetricConfig.color }} />
              <span className="tooltip-label">{activeMetricConfig.label}:</span>
              <strong>{activeMetricConfig.format(hoveredData.val)}</strong>
            </div>
            <div className="tooltip-breakdown">
              <span>👥 {hoveredData.raw.activeUsers || 0} users</span>
              <span>⚡ {hoveredData.raw.totalSessions || 0} sessions</span>
              <span>⏱️ {Number(hoveredData.raw.avgDurationMinutesPerUser || 0).toFixed(1)}m avg</span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats Footer */}
      <div className="chart-summary-bar">
        <div className="summary-item">
          <span className="summary-label">Period Peak</span>
          <span className="summary-value" style={{ color: activeMetricConfig.color }}>
            {activeMetricConfig.format(summaryStats.peak)}
          </span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-label">Daily Average</span>
          <span className="summary-value">
            {activeMetricConfig.format(summaryStats.avg)}
          </span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-label">Period Aggregate</span>
          <span className="summary-value">
            {activeMetricConfig.format(summaryStats.total)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ActivityTrendChart;
