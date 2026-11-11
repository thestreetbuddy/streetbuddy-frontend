import api from './axios';

/**
 * 1. Overview Summary & Charts Data
 * GET /analytics/admin/overview
 * Query Params:
 *  - date (YYYY-MM-DD)
 *  - startDate & endDate (for date range filtering)
 */
export const getVisitorOverview = (params = {}) => {
  return api.get('/analytics/admin/overview', { params });
};

/**
 * 2. Paginated Visitor Logs Table
 * GET /analytics/admin/logs
 * Query Params:
 *  - page (number, default: 1)
 *  - limit (number, default: 20)
 *  - date (YYYY-MM-DD, optional)
 *  - startDate & endDate (optional)
 *  - device ('Mobile' | 'Desktop' | 'Tablet', optional)
 *  - search (string, optional)
 */
export const getVisitorLogs = (params = {}) => {
  return api.get('/analytics/admin/logs', { params });
};

/**
 * Utility: Format timestamp in IST (DD MMM YYYY, hh:mm:ss A or hh:mm A)
 */
export const formatISTDateTime = (dateString, includeSeconds = true) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(date);
};

/**
 * Utility: Format date for chart axis (DD MMM)
 */
export const formatChartDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(date);
};

/**
 * Utility: Get date string in YYYY-MM-DD format with offset days
 */
export const getDateString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

