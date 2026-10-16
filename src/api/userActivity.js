import api from './axios';

/**
 * Fetch top-level user activity and live presence summary metrics.
 * Endpoint: GET /admin/analytics/user-activity/summary
 */
export const getActivitySummary = () => {
  return api.get('/admin/analytics/user-activity/summary');
};

/**
 * Fetch historical activity trends for charts.
 * Endpoint: GET /admin/analytics/user-activity/trends?days=7|14|30
 * @param {number} days - Number of days to look back (default 7)
 */
export const getActivityTrends = (days = 7) => {
  return api.get('/admin/analytics/user-activity/trends', {
    params: { days },
  });
};

/**
 * Fetch paginated user activity and live online status list.
 * Endpoint: GET /admin/analytics/user-activity/users?page=1&limit=10&search=
 * @param {number} page - Current page (1-indexed)
 * @param {number} limit - Number of items per page
 * @param {string} search - Search query (username, full name, email)
 */
export const getUserActivityList = (page = 1, limit = 10, search = '') => {
  const params = {
    page,
    limit,
  };
  if (search && search.trim()) {
    params.search = search.trim();
  }
  return api.get('/admin/analytics/user-activity/users', { params });
};
