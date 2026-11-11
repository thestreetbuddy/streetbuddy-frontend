import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Footprints,
  Calendar,
  RefreshCw,
  Clock,
  AlertCircle,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  getVisitorOverview,
  getVisitorLogs,
  getDateString,
} from '../api/visitorAnalyticsApi';
import VisitorMetricCards from '../components/visitorAnalytics/VisitorMetricCards';
import VisitorTrafficChart from '../components/visitorAnalytics/VisitorTrafficChart';
import VisitorDeviceBreakdown from '../components/visitorAnalytics/VisitorDeviceBreakdown';
import VisitorLogsTable from '../components/visitorAnalytics/VisitorLogsTable';
import '../styles/visitorAnalytics.css';

const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last_7_days', label: 'Last 7 Days' },
  { id: 'custom', label: 'Custom Range...' },
];

function VisitorAnalytics() {
  // --- Date Filters ---
  const [selectedPreset, setSelectedPreset] = useState('today');
  const [customStart, setCustomStart] = useState(getDateString(7));
  const [customEnd, setCustomEnd] = useState(getDateString(0));

  // --- Search & Logs Filter ---
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('all');

  // --- Pagination ---
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // --- API States ---
  const [overviewData, setOverviewData] = useState({
    summary: {},
    deviceBreakdown: [],
    topPages: [],
    topReferrers: [],
    dailyTrends: [],
  });
  const [logs, setLogs] = useState([]);

  // --- Loading & Error States ---
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState('');

  const debounceTimerRef = useRef(null);

  // Debounce search query
  const handleSearchChange = (val) => {
    setSearchTerm(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
  };

  // Compute API date parameters based on current preset
  const getDateParams = useCallback(() => {
    if (selectedPreset === 'today') {
      return { date: getDateString(0) };
    }
    if (selectedPreset === 'yesterday') {
      return { date: getDateString(1) };
    }
    if (selectedPreset === 'last_7_days') {
      return {
        startDate: getDateString(6),
        endDate: getDateString(0),
      };
    }
    if (selectedPreset === 'custom') {
      return {
        startDate: customStart,
        endDate: customEnd,
      };
    }
    return { date: getDateString(0) };
  }, [selectedPreset, customStart, customEnd]);

  // Fetch Overview Data
  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const dateParams = getDateParams();
      const res = await getVisitorOverview(dateParams);
      const data = res.data?.data || res.data || {};

      setOverviewData({
        summary: data.summary || {},
        deviceBreakdown: data.deviceBreakdown || [],
        topPages: data.topPages || [],
        topReferrers: data.topReferrers || [],
        dailyTrends: data.dailyTrends || [],
      });
      setApiError(null);
    } catch (err) {
      console.error('Failed to fetch visitor overview:', err);
      setApiError(err.response?.data?.message || 'Unable to connect to visitor analytics.');
    } finally {
      setLoadingOverview(false);
    }
  }, [getDateParams]);

  // Fetch Logs Data
  const fetchLogs = useCallback(
    async (page, limit, search, device) => {
      setLoadingLogs(true);
      try {
        const dateParams = getDateParams();
        const params = {
          page,
          limit,
          ...dateParams,
          ...(device !== 'all' && { device }),
          ...(search && { search }),
        };

        const res = await getVisitorLogs(params);
        const data = res.data?.data || res.data || {};
        const logList = Array.isArray(data) ? data : data.data || data.logs || [];

        setLogs(logList);

        const pag = res.data?.pagination || data.pagination || {};
        const totalRecords = pag.total ?? logList.length;
        const totalPages = pag.totalPages ?? (Math.ceil(totalRecords / limit) || 1);

        setPagination((prev) => ({
          ...prev,
          page: pag.page || page,
          limit: pag.limit || limit,
          total: totalRecords,
          totalPages: totalPages,
        }));
      } catch (err) {
        console.error('Failed to fetch visitor logs:', err);
      } finally {
        setLoadingLogs(false);
      }
    },
    [getDateParams]
  );

  // Initial & Filter change trigger
  useEffect(() => {
    fetchOverview();
    setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
  }, [fetchOverview]);

  useEffect(() => {
    fetchLogs(pagination.page, pagination.limit, debouncedSearch, deviceFilter);
  }, [fetchLogs, pagination.page, pagination.limit, debouncedSearch, deviceFilter]);

  // Refresh Both handler
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchOverview(),
        fetchLogs(pagination.page, pagination.limit, debouncedSearch, deviceFilter),
      ]);
      setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handlePresetSelect = (presetId) => {
    setSelectedPreset(presetId);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleApplyCustomDates = () => {
    if (!customStart || !customEnd) return;
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchOverview();
  };

  const handleResetTableFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setDeviceFilter('all');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="visitor-analytics-page">
      {/* 1. Header Card with Title and Date Controls */}
      <div className="visitor-header-card">
        <div className="header-left">
          <div className="header-icon-box">
            <Footprints size={28} />
          </div>
          <div>
            <div className="header-title-badge-row">
              <h1 className="header-title">Visitor Tracking & Traffic Analytics</h1>
              <span className="live-stream-badge">
                <span className="pulse-ping" />
                Live Traffic Logging
              </span>
            </div>
            <p className="header-sub">
              Monitor daily traffic, visit frequency, user session durations, and devices.
            </p>
          </div>
        </div>

        <div className="header-right">
          {/* Preset Buttons */}
          <div className="preset-buttons-group">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`preset-btn ${selectedPreset === preset.id ? 'active' : ''}`}
                onClick={() => handlePresetSelect(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            className="header-refresh-btn"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            title="Refresh overview and visitor logs"
          >
            <RefreshCw size={16} className={isRefreshing ? 'spin-anim' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Custom Date Pickers Sub-bar (if custom range selected) */}
      {selectedPreset === 'custom' && (
        <div className="custom-range-bar">
          <div className="date-field">
            <span className="date-label">Start Date:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="native-date-input"
            />
          </div>

          <div className="date-field">
            <span className="date-label">End Date:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="native-date-input"
            />
          </div>

          <button
            type="button"
            className="apply-range-btn"
            onClick={handleApplyCustomDates}
            disabled={!customStart || !customEnd}
          >
            Apply Range
          </button>
        </div>
      )}

      {/* Global Error Banner */}
      {apiError && (
        <div className="visitor-error-banner">
          <AlertCircle size={18} />
          <span>{apiError}</span>
          <button type="button" className="retry-btn-pill" onClick={handleRefreshAll}>
            Retry
          </button>
        </div>
      )}

      {/* 2. Top KPI Metrics (4 Cards) */}
      <VisitorMetricCards summary={overviewData.summary} loading={loadingOverview} />

      {/* 3. Middle Visuals: 70% Chart / Pages + 30% Devices / Referrers */}
      <div className="visitor-middle-grid">
        <div className="middle-left-col">
          <VisitorTrafficChart
            dailyTrends={overviewData.dailyTrends}
            topPages={overviewData.topPages}
            loading={loadingOverview}
          />
        </div>

        <div className="middle-right-col">
          <VisitorDeviceBreakdown
            deviceBreakdown={overviewData.deviceBreakdown}
            topReferrers={overviewData.topReferrers}
            loading={loadingOverview}
          />
        </div>
      </div>

      {/* 4. Bottom: Detailed Visitor Logs Table */}
      <VisitorLogsTable
        logs={logs}
        pagination={pagination}
        onPageChange={(newPage) => setPagination((prev) => ({ ...prev, page: newPage }))}
        onLimitChange={(newLimit) => setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }))}
        deviceFilter={deviceFilter}
        onDeviceFilterChange={(newDev) => {
          setDeviceFilter(newDev);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        loading={loadingLogs}
        onResetFilters={handleResetTableFilters}
      />
    </div>
  );
}

export default VisitorAnalytics;

