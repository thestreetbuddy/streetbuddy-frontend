import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Tooltip,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Activity,
  Users,
  Radio,
  Clock,
  TrendingUp,
  Layers,
  Search,
  RotateCcw,
  X,
  Flame,
  Zap,
  Sparkles,
  Wifi,
  UserCheck,
} from 'lucide-react';

import {
  getActivitySummary,
  getActivityTrends,
  getUserActivityList,
} from '../api/userActivity';
import ActivityTrendChart from '../components/analytics/ActivityTrendChart';
import '../styles/userActivity.css';

// Gradient palette for user avatars based on identifier hash
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #ff7a2f, #ea580c)',
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #ec4899, #be185d)',
  'linear-gradient(135deg, #f59e0b, #b45309)',
  'linear-gradient(135deg, #06b6d4, #0e7490)',
];

function getAvatarGradient(key = '') {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

function getInitials(fullName = '', username = '') {
  const target = (fullName || username || 'U').trim();
  const parts = target.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return target.substring(0, 2).toUpperCase();
}

function formatDuration(minutes) {
  const val = Number(minutes) || 0;
  if (val <= 0) return '0m';
  if (val < 60) return `${val % 1 === 0 ? val : val.toFixed(1)}m`;
  const hrs = Math.floor(val / 60);
  const remainingMins = Math.round(val % 60);
  if (remainingMins === 0) return `${hrs}h`;
  return `${hrs}h ${remainingMins}m`;
}

function formatRelativeTime(dateString) {
  if (!dateString) return 'Never active';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';

  const now = new Date();
  const diffInSec = Math.floor((now - date) / 1000);

  if (diffInSec < 45) return 'Just now';
  if (diffInSec < 90) return '1 min ago';
  if (diffInSec < 3600) return `${Math.floor(diffInSec / 60)} mins ago`;
  if (diffInSec < 7200) return '1 hour ago';
  if (diffInSec < 86400) return `${Math.floor(diffInSec / 3600)} hours ago`;
  if (diffInSec < 172800) return 'Yesterday';
  if (diffInSec < 604800) return `${Math.floor(diffInSec / 86400)} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatFullDateTime(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function UserActivity() {
  // --- States ---
  const [summary, setSummary] = useState({
    currentlyOnline: 0,
    dailyActiveUsers: 0,
    weeklyActiveUsers: 0,
    monthlyActiveUsers: 0,
    todayTotalSessions: 0,
    todayTotalMinutes: 0,
    todayAvgMinutesPerUser: 0,
    weeklyTotalMinutes: 0,
    weeklyAvgMinutesPerUser: 0,
    dauToWauPercentage: 0,
  });

  const [trends, setTrends] = useState([]);
  const [trendDays, setTrendDays] = useState(7);

  const [usersList, setUsersList] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(0); // 0-indexed for MUI TablePagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [presenceFilter, setPresenceFilter] = useState('ALL'); // ALL, ONLINE, OFFLINE

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [apiError, setApiError] = useState(null);

  const debounceTimerRef = useRef(null);

  // --- Search Debouncing ---
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(0); // Reset to first page upon new search
    }, 350);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setPage(0);
  };

  // --- Fetch Summary ---
  const fetchSummary = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoadingSummary(true);
    try {
      const res = await getActivitySummary();
      const data = res.data?.data || res.data || {};
      setSummary({
        currentlyOnline: data.currentlyOnline ?? 0,
        dailyActiveUsers: data.dailyActiveUsers ?? 0,
        weeklyActiveUsers: data.weeklyActiveUsers ?? 0,
        monthlyActiveUsers: data.monthlyActiveUsers ?? 0,
        todayTotalSessions: data.todayTotalSessions ?? 0,
        todayTotalMinutes: Number(data.todayTotalMinutes) || 0,
        todayAvgMinutesPerUser: Number(data.todayAvgMinutesPerUser) || 0,
        weeklyTotalMinutes: Number(data.weeklyTotalMinutes) || 0,
        weeklyAvgMinutesPerUser: Number(data.weeklyAvgMinutesPerUser) || 0,
        dauToWauPercentage: Number(data.dauToWauPercentage) || 0,
      });
      setApiError(null);
    } catch (err) {
      console.error('Failed to fetch activity summary:', err);
      if (!isSilent) {
        setApiError(
          err.response?.data?.message ||
            'Unable to fetch live activity summary from server.'
        );
      }
    } finally {
      if (!isSilent) setLoadingSummary(false);
    }
  }, []);

  // --- Fetch Trends ---
  const fetchTrends = useCallback(
    async (days = trendDays) => {
      setLoadingTrends(true);
      try {
        const res = await getActivityTrends(days);
        const data = res.data?.data || res.data || [];
        setTrends(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch activity trends:', err);
      } finally {
        setLoadingTrends(false);
      }
    },
    [trendDays]
  );

  // --- Fetch Users Activity List ---
  const fetchUsers = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoadingUsers(true);
      try {
        const apiPage = page + 1; // Backend is 1-indexed
        const res = await getUserActivityList(apiPage, rowsPerPage, debouncedSearch);
        const data = res.data?.data || res.data || {};
        const items = data.users || (Array.isArray(data) ? data : []);
        setUsersList(items);
        setTotalUsers(data.total ?? items.length);
      } catch (err) {
        console.error('Failed to fetch user activity list:', err);
      } finally {
        if (!isSilent) setLoadingUsers(false);
      }
    },
    [page, rowsPerPage, debouncedSearch]
  );

  // --- Refresh All ---
  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchSummary(false),
        fetchTrends(trendDays),
        fetchUsers(false),
      ]);
      setLastSyncTime(new Date().toLocaleTimeString());
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  // --- Initial load & parameter reactions ---
  useEffect(() => {
    fetchSummary();
    setLastSyncTime(new Date().toLocaleTimeString());
  }, [fetchSummary]);

  useEffect(() => {
    fetchTrends(trendDays);
  }, [fetchTrends, trendDays]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- Auto-refresh timer (Every 30s) ---
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchSummary(true);
      fetchUsers(true);
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchSummary, fetchUsers]);

  // --- Filtered Users on Current View ---
  const displayedUsers = useMemo(() => {
    if (presenceFilter === 'ONLINE') {
      return usersList.filter((u) => u.isOnline);
    }
    if (presenceFilter === 'OFFLINE') {
      return usersList.filter((u) => !u.isOnline);
    }
    return usersList;
  }, [usersList, presenceFilter]);

  // --- Online users count in current batch ---
  const currentBatchOnlineCount = useMemo(() => {
    return usersList.filter((u) => u.isOnline).length;
  }, [usersList]);

  return (
    <section>
      <div className="activity-dashboard">
        {/* API Error Notification */}
        {apiError && (
          <Alert
            severity="error"
            action={
              <button
                type="button"
                className="btn-refresh"
                style={{ padding: '4px 10px', fontSize: '11px' }}
                onClick={handleRefreshAll}
              >
                Retry
              </button>
            }
          >
            {apiError}
          </Alert>
        )}

        {/* Header Bar */}
        <div className="activity-header-card">
          <div className="activity-header-left">
            <div className="activity-header-icon">
              <Activity size={26} />
            </div>
            <div>
              <h2 className="activity-header-title">
                User Activity & Online Presence
                <span className="live-indicator-pill">
                  <span className="pulse-dot" />
                  Live Sync
                </span>
              </h2>
              <p className="activity-header-subtitle">
                Monitor real-time active users, stickiness, session duration, and live presence
              </p>
            </div>
          </div>

          <div className="activity-header-actions">
            {lastSyncTime && (
              <span className="sync-status">
                <Wifi size={13} />
                Synced at {lastSyncTime}
              </span>
            )}

            <label className="auto-refresh-toggle">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ accentColor: '#ff7a2f' }}
              />
              Auto-refresh (30s)
            </label>

            <button
              type="button"
              className="btn-refresh"
              onClick={handleRefreshAll}
              disabled={refreshing}
            >
              <RotateCcw size={15} className={refreshing ? 'spinning' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* ====================================================
            TOP METRICS CARDS
           ==================================================== */}
        <div className="metrics-grid">
          {/* Card 1: Currently Online */}
          <div className="metric-card metric-card-green">
            <div>
              <div className="metric-card-top">
                <div className="metric-icon-box">
                  <Radio size={24} />
                </div>
                <span className="metric-badge badge-green">
                  <span
                    className="pulse-dot"
                    style={{
                      display: 'inline-block',
                      marginRight: 5,
                      verticalAlign: 'middle',
                    }}
                  />
                  Online Now
                </span>
              </div>
              <h4 className="metric-title">Currently Online</h4>
              {loadingSummary ? (
                <Skeleton width="60%" height={48} />
              ) : (
                <div className="metric-main-value">
                  {summary.currentlyOnline.toLocaleString()}
                  <span className="metric-unit">users live</span>
                </div>
              )}
            </div>
            <div className="metric-sub-breakdown">
              <div className="breakdown-item">
                <span className="breakdown-item-label">Status</span>
                <span className="breakdown-item-val" style={{ color: '#059669' }}>
                  Real-time active
                </span>
              </div>
              <div className="breakdown-item" style={{ alignItems: 'flex-end' }}>
                <span className="breakdown-item-label">In current table view</span>
                <span className="breakdown-item-val">
                  {currentBatchOnlineCount} users
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Active Users (DAU / WAU / MAU) */}
          <div className="metric-card metric-card-blue">
            <div>
              <div className="metric-card-top">
                <div className="metric-icon-box">
                  <Users size={24} />
                </div>
                <span className="metric-badge badge-blue">Engagement</span>
              </div>
              <h4 className="metric-title">Active Users (DAU)</h4>
              {loadingSummary ? (
                <Skeleton width="60%" height={48} />
              ) : (
                <div className="metric-main-value">
                  {summary.dailyActiveUsers.toLocaleString()}
                  <span className="metric-unit">today</span>
                </div>
              )}
            </div>
            <div className="metric-sub-breakdown">
              <div className="breakdown-item">
                <span className="breakdown-item-label">WAU (7D)</span>
                <span className="breakdown-item-val">
                  {summary.weeklyActiveUsers.toLocaleString()}
                </span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-item-label">MAU (30D)</span>
                <span className="breakdown-item-val">
                  {summary.monthlyActiveUsers.toLocaleString()}
                </span>
              </div>
              <div className="breakdown-item" style={{ alignItems: 'flex-end' }}>
                <span className="breakdown-item-label">DAU/MAU</span>
                <span className="breakdown-item-val">
                  {summary.monthlyActiveUsers > 0
                    ? `${((summary.dailyActiveUsers / summary.monthlyActiveUsers) * 100).toFixed(1)}%`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Screen Time Today */}
          <div className="metric-card metric-card-amber">
            <div>
              <div className="metric-card-top">
                <div className="metric-icon-box">
                  <Clock size={24} />
                </div>
                <span className="metric-badge badge-amber">Screen Time</span>
              </div>
              <h4 className="metric-title">Today's Duration</h4>
              {loadingSummary ? (
                <Skeleton width="60%" height={48} />
              ) : (
                <div className="metric-main-value">
                  {formatDuration(summary.todayTotalMinutes)}
                  <span className="metric-unit">
                    ({summary.todayTotalMinutes.toFixed(0)}m)
                  </span>
                </div>
              )}
            </div>
            <div className="metric-sub-breakdown">
              <div className="breakdown-item">
                <span className="breakdown-item-label">Avg / User</span>
                <span className="breakdown-item-val">
                  {formatDuration(summary.todayAvgMinutesPerUser)}
                </span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-item-label">Weekly Total</span>
                <span className="breakdown-item-val">
                  {formatDuration(summary.weeklyTotalMinutes)}
                </span>
              </div>
              <div className="breakdown-item" style={{ alignItems: 'flex-end' }}>
                <span className="breakdown-item-label">Weekly Avg</span>
                <span className="breakdown-item-val">
                  {formatDuration(summary.weeklyAvgMinutesPerUser)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Stickiness & Retention */}
          <div className="metric-card metric-card-purple">
            <div>
              <div className="metric-card-top">
                <div className="metric-icon-box">
                  <TrendingUp size={24} />
                </div>
                <span className="metric-badge badge-purple">Stickiness</span>
              </div>
              <h4 className="metric-title">DAU / WAU Ratio</h4>
              {loadingSummary ? (
                <Skeleton width="60%" height={48} />
              ) : (
                <div className="metric-main-value">
                  {summary.dauToWauPercentage.toFixed(1)}%
                  <span className="metric-unit">retention</span>
                </div>
              )}
            </div>
            <div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, summary.dauToWauPercentage))}%`,
                  }}
                />
              </div>
              <div className="metric-sub-breakdown" style={{ marginTop: 8 }}>
                <div className="breakdown-item">
                  <span className="breakdown-item-label">Sessions Today</span>
                  <span className="breakdown-item-val">
                    {summary.todayTotalSessions.toLocaleString()}
                  </span>
                </div>
                <div className="breakdown-item" style={{ alignItems: 'flex-end' }}>
                  <span className="breakdown-item-label">Health</span>
                  <span
                    className="breakdown-item-val"
                    style={{
                      color:
                        summary.dauToWauPercentage > 40
                          ? '#059669'
                          : summary.dauToWauPercentage > 20
                          ? '#d97706'
                          : '#dc2626',
                    }}
                  >
                    {summary.dauToWauPercentage > 40
                      ? 'High Engagement'
                      : summary.dauToWauPercentage > 20
                      ? 'Moderate'
                      : 'Low'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            ACTIVITY TRENDS CHART
           ==================================================== */}
        <ActivityTrendChart
          data={trends}
          days={trendDays}
          onDaysChange={(newDays) => setTrendDays(newDays)}
          loading={loadingTrends}
        />

        {/* ====================================================
            USER ACTIVITY & ONLINE PRESENCE TABLE
           ==================================================== */}
        <div className="activity-table-card">
          <div className="table-toolbar">
            <div className="table-title-group">
              <h3 className="table-title">User Activity & Live Status</h3>
              <span className="table-count-badge">
                {totalUsers.toLocaleString()} Users
              </span>
            </div>

            <div className="table-controls">
              {/* Presence Filter Pills */}
              <div className="filter-pills">
                <button
                  type="button"
                  className={`filter-pill ${presenceFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setPresenceFilter('ALL')}
                >
                  <Users size={14} />
                  <span>All</span>
                </button>
                <button
                  type="button"
                  className={`filter-pill ${presenceFilter === 'ONLINE' ? 'active' : ''}`}
                  onClick={() => setPresenceFilter('ONLINE')}
                >
                  <span className="pulse-dot" style={{ width: 6, height: 6 }} />
                  <span>Online</span>
                </button>
                <button
                  type="button"
                  className={`filter-pill ${presenceFilter === 'OFFLINE' ? 'active' : ''}`}
                  onClick={() => setPresenceFilter('OFFLINE')}
                >
                  <Clock size={14} />
                  <span>Offline</span>
                </button>
              </div>

              {/* Search Box with debounce */}
              <div className="search-box-wrapper">
                <Search size={16} className="search-icon-left" />
                <input
                  type="text"
                  placeholder="Search name, username, or email..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="search-input"
                />
                {searchInput && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={handleClearSearch}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Custom MUI Table */}
          <TableContainer className="custom-table-container">
            <Table className="custom-table">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Presence</TableCell>
                  <TableCell>Last Active</TableCell>
                  <TableCell>Today's Active Time</TableCell>
                  <TableCell>Weekly Active Time</TableCell>
                  <TableCell align="center">Total Sessions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingUsers ? (
                  // Skeleton Loading Rows
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Skeleton variant="circular" width={42} height={42} />
                          <div>
                            <Skeleton width={120} height={20} />
                            <Skeleton width={160} height={16} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton width={80} height={28} style={{ borderRadius: 14 }} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={90} height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={70} height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={70} height={20} />
                      </TableCell>
                      <TableCell align="center">
                        <Skeleton
                          width={60}
                          height={24}
                          style={{ margin: '0 auto', borderRadius: 8 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : displayedUsers.length === 0 ? (
                  // Empty State
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="empty-table-state">
                        <div className="empty-icon-box">
                          <UserCheck size={30} />
                        </div>
                        <h4 className="empty-title">No User Activity Found</h4>
                        <p className="empty-desc">
                          {searchInput
                            ? `No users matching "${searchInput}". Try adjusting your search query.`
                            : presenceFilter !== 'ALL'
                            ? `No ${presenceFilter.toLowerCase()} users found in this page.`
                            : 'No user activity records available at this time.'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  // Render User Rows
                  displayedUsers.map((user) => {
                    const initials = getInitials(user.fullName, user.username);
                    const avatarGradient = getAvatarGradient(user.username || user.fullName || '');

                    return (
                      <TableRow key={user.id || user.username}>
                        {/* User Column */}
                        <TableCell>
                          <div className="user-info-cell">
                            <div className="user-avatar-wrap">
                              <Avatar
                                src={user.profilePhoto || ''}
                                alt={user.fullName || user.username}
                                className="user-avatar"
                                style={{ background: avatarGradient }}
                              >
                                {initials}
                              </Avatar>
                              {user.isOnline && (
                                <span className="user-online-badge-dot" />
                              )}
                            </div>
                            <div className="user-details">
                              <div className="user-name-line">
                                <span className="user-full-name">
                                  {user.fullName || user.username || 'Unnamed User'}
                                </span>
                                {user.status && (
                                  <span className="user-status-pill">
                                    {user.status}
                                  </span>
                                )}
                              </div>
                              <span className="user-username">
                                @{user.username || 'user'}
                              </span>
                              {user.email && (
                                <span className="user-email">{user.email}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Online Status Column */}
                        <TableCell>
                          {user.isOnline ? (
                            <span className="presence-chip online">
                              <span className="chip-pulse-dot" />
                              Online
                            </span>
                          ) : (
                            <span className="presence-chip offline">
                              <span className="chip-offline-dot" />
                              Offline
                            </span>
                          )}
                        </TableCell>

                        {/* Last Active Column */}
                        <TableCell>
                          <Tooltip
                            title={formatFullDateTime(user.lastActiveAt)}
                            arrow
                            placement="top"
                          >
                            <span style={{ cursor: 'pointer' }}>
                              <div className="time-cell-main">
                                {formatRelativeTime(user.lastActiveAt)}
                              </div>
                              <div className="time-cell-sub">
                                {user.lastActiveAt
                                  ? new Date(user.lastActiveAt).toLocaleDateString()
                                  : '-'}
                              </div>
                            </span>
                          </Tooltip>
                        </TableCell>

                        {/* Today's Active Time */}
                        <TableCell>
                          <div className="time-cell-main">
                            {formatDuration(user.todayActiveMinutes)}
                          </div>
                          <div className="time-cell-sub">
                            {Number(user.todayActiveMinutes || 0).toFixed(1)} mins
                          </div>
                        </TableCell>

                        {/* Weekly Active Time */}
                        <TableCell>
                          <div className="time-cell-main">
                            {formatDuration(user.weeklyActiveMinutes)}
                          </div>
                          <div className="time-cell-sub">
                            {Number(user.weeklyActiveMinutes || 0).toFixed(1)} mins
                          </div>
                        </TableCell>

                        {/* Total Sessions Column */}
                        <TableCell align="center">
                          <span className="sessions-badge">
                            <Layers size={13} />
                            {user.totalSessions || 0}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={totalUsers}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </TableContainer>
        </div>
      </div>
    </section>
  );
}

export default UserActivity;
