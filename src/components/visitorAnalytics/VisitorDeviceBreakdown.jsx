import { useMemo } from 'react';
import {
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Share2,
  ExternalLink,
  PieChart as PieIcon,
  Compass,
} from 'lucide-react';

const DEVICE_CONFIG = {
  mobile: {
    label: 'Mobile',
    icon: Smartphone,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    textColor: '#1d4ed8',
  },
  desktop: {
    label: 'Desktop',
    icon: Monitor,
    color: '#10b981',
    bgColor: '#ecfdf5',
    textColor: '#047857',
  },
  tablet: {
    label: 'Tablet',
    icon: Tablet,
    color: '#f59e0b',
    bgColor: '#fffbeb',
    textColor: '#b45309',
  },
};

function cleanReferrerName(ref = '') {
  if (!ref || ref.toLowerCase() === 'direct') return 'Direct / Bookmarks';
  try {
    const url = new URL(ref);
    return url.hostname.replace('www.', '');
  } catch {
    return ref.replace('https://', '').replace('http://', '').replace('www.', '');
  }
}

function VisitorDeviceBreakdown({
  deviceBreakdown = [],
  topReferrers = [],
  loading = false,
}) {
  // Calculate SVG donut stroke offsets
  const donutSegments = useMemo(() => {
    if (!deviceBreakdown || deviceBreakdown.length === 0) return [];

    const circumference = 2 * Math.PI * 40; // r = 40
    let accumulatedPercent = 0;

    return deviceBreakdown.map((item) => {
      const devKey = (item.device || '').toLowerCase();
      const config = DEVICE_CONFIG[devKey] || DEVICE_CONFIG.mobile;
      const pct = Number(item.percentage) || 0;
      const strokeDasharray = `${(pct / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
      accumulatedPercent += pct;

      return {
        ...item,
        config,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [deviceBreakdown]);

  const totalVisitorsFromDevices = useMemo(() => {
    return deviceBreakdown.reduce((sum, d) => sum + (d.visitors || 0), 0);
  }, [deviceBreakdown]);

  return (
    <div className="visitor-side-cards-column">
      {/* 1. Device Distribution Card */}
      <div className="side-card device-card">
        <div className="side-card-header">
          <div className="side-card-icon-wrap blue">
            <PieIcon size={18} />
          </div>
          <div>
            <h4 className="side-card-title">Device Breakdown</h4>
            <span className="side-card-subtitle">Platform & screen distribution</span>
          </div>
        </div>

        <div className="donut-and-legend-row">
          {/* SVG Donut */}
          <div className="donut-wrapper">
            <svg viewBox="0 0 100 100" className="donut-svg">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="14"
              />
              {donutSegments.map((seg, i) => (
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={seg.config.color}
                  strokeWidth="14"
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  className="donut-segment"
                />
              ))}
            </svg>
            <div className="donut-inner-content">
              <span className="donut-inner-val">{totalVisitorsFromDevices}</span>
              <span className="donut-inner-lbl">Visitors</span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="device-legend-list">
            {deviceBreakdown.map((item, idx) => {
              const devKey = (item.device || '').toLowerCase();
              const config = DEVICE_CONFIG[devKey] || DEVICE_CONFIG.mobile;
              const Icon = config.icon;

              return (
                <div key={idx} className="device-legend-item">
                  <div className="legend-left">
                    <div
                      className="device-badge-icon"
                      style={{ background: config.bgColor, color: config.textColor }}
                    >
                      <Icon size={13} />
                    </div>
                    <span className="device-name">{config.label}</span>
                  </div>

                  <div className="legend-right">
                    <span className="device-visitors-count">{item.visitors}</span>
                    <span
                      className="device-pct-tag"
                      style={{ background: config.bgColor, color: config.textColor }}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Top Referrers / Traffic Sources Card */}
      <div className="side-card referrers-card">
        <div className="side-card-header">
          <div className="side-card-icon-wrap emerald">
            <Compass size={18} />
          </div>
          <div>
            <h4 className="side-card-title">Top Traffic Referrers</h4>
            <span className="side-card-subtitle">Where visitors originate from</span>
          </div>
        </div>

        <div className="referrers-list">
          {topReferrers.length === 0 ? (
            <div className="empty-referrers">
              <Globe size={20} />
              <span>No referrer origins recorded</span>
            </div>
          ) : (
            topReferrers.map((refItem, idx) => {
              const cleanName = cleanReferrerName(refItem.referrer);
              const isDirect = cleanName.toLowerCase().includes('direct');
              const isGoogle = cleanName.toLowerCase().includes('google');
              const isSocial =
                cleanName.toLowerCase().includes('instagram') ||
                cleanName.toLowerCase().includes('facebook') ||
                cleanName.toLowerCase().includes('twitter') ||
                cleanName.toLowerCase().includes('linkedin');

              return (
                <div key={idx} className="referrer-row">
                  <div className="ref-left">
                    <span
                      className={`ref-type-dot ${
                        isDirect ? 'direct' : isGoogle ? 'search' : isSocial ? 'social' : 'other'
                      }`}
                    />
                    <div className="ref-name-group">
                      <strong className="ref-title">{cleanName}</strong>
                      <span className="ref-category">
                        {isDirect
                          ? 'Direct Traffic'
                          : isGoogle
                          ? 'Organic Search'
                          : isSocial
                          ? 'Social Network'
                          : 'Referral Link'}
                      </span>
                    </div>
                  </div>

                  <div className="ref-right">
                    <span className="ref-visitors-pill">
                      <strong>{(refItem.visitors || 0).toLocaleString()}</strong> users
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default VisitorDeviceBreakdown;

