import api from './axios';

/**
 * Helper to try primary analytics URL and fall back to alias if 404
 */
const requestWithFallback = async (primaryUrl, fallbackUrl, config = {}) => {
  try {
    return await api.get(primaryUrl, config);
  } catch (err) {
    if (err.response && err.response.status === 404 && fallbackUrl) {
      return await api.get(fallbackUrl, config);
    }
    throw err;
  }
};

/**
 * 1. Summary Cards API
 * GET /admin/analytics/financial/summary (Alias: /admin/financial/summary)
 * Query Params: period, startDate, endDate, paymentStatus, paymentGateway
 */
export const getFinancialSummary = (params = {}) => {
  return requestWithFallback(
    '/admin/analytics/financial/summary',
    '/admin/financial/summary',
    { params }
  );
};

/**
 * 2. Revenue Chart Trends API
 * GET /admin/analytics/financial/revenue (Alias: /admin/financial/revenue)
 * Query Params: period, startDate, endDate, interval ('day' | 'month')
 */
export const getFinancialRevenueTrends = (params = {}) => {
  return requestWithFallback(
    '/admin/analytics/financial/revenue',
    '/admin/financial/revenue',
    { params }
  );
};

/**
 * 3. Transaction List API
 * GET /admin/analytics/financial/transactions (Alias: /admin/financial/transactions)
 * Query Params: page, limit, sortBy, period, startDate, endDate, paymentStatus, paymentGateway, paymentMethod, userId, razorpayPaymentId
 */
export const getFinancialTransactions = (params = {}) => {
  return requestWithFallback(
    '/admin/analytics/financial/transactions',
    '/admin/financial/transactions',
    { params }
  );
};

/**
 * 4. Single Transaction Details API
 * GET /admin/analytics/financial/transactions/:transactionId
 */
export const getTransactionDetails = (transactionId) => {
  return requestWithFallback(
    `/admin/analytics/financial/transactions/${transactionId}`,
    `/admin/financial/transactions/${transactionId}`
  );
};

/**
 * 5. Razorpay Sync API
 * POST /admin/analytics/financial/reconciliation/sync
 * Body: { limit: 50, forceRecheck: false }
 */
export const syncRazorpayReconciliation = (data = { limit: 50, forceRecheck: false }) => {
  return api
    .post('/admin/analytics/financial/reconciliation/sync', data)
    .catch((err) => {
      if (err.response && err.response.status === 404) {
        return api.post('/admin/financial/reconciliation/sync', data);
      }
      throw err;
    });
};

/**
 * Utility: Format amount in Indian Rupee format (e.g. ₹194.30)
 */
export const formatINR = (amount, includeDecimals = true) => {
  const num = Number(amount);
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Utility: Format date in IST timezone (DD MMM YYYY, hh:mm A)
 */
export const formatISTDateTime = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(date);
};

/**
 * Utility: Format date for chart labels and display (DD MMM YYYY)
 */
export const formatISTDateOnly = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date);
};

