import { useEffect, useState, useCallback, useRef } from 'react';
import {
  BadgeIndianRupee,
  RefreshCw,
  Zap,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import {
  getFinancialSummary,
  getFinancialRevenueTrends,
  getFinancialTransactions,
  syncRazorpayReconciliation,
} from '../api/financialApi';
import FinancialSummaryCards from '../components/financial/FinancialSummaryCards';
import RevenueTrendChart from '../components/financial/RevenueTrendChart';
import FinancialFiltersBar from '../components/financial/FinancialFiltersBar';
import TransactionTable from '../components/financial/TransactionTable';
import TransactionDetailDrawer from '../components/financial/TransactionDetailDrawer';
import '../styles/financial.css';

function FinancialDashboard() {
  // --- Active Filters ---
  const [filters, setFilters] = useState({
    period: 'last_30_days',
    startDate: '',
    endDate: '',
    paymentStatus: 'all',
    paymentGateway: 'all',
    paymentMethod: 'all',
    searchQuery: '',
  });

  const [interval, setInterval] = useState('day'); // 'day' | 'month'
  const [sortBy, setSortBy] = useState('date_desc');

  // --- Pagination ---
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total_records: 0,
    total_pages: 1,
  });

  // --- API Data States ---
  const [summary, setSummary] = useState(null);
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filteredTotals, setFilteredTotals] = useState({});

  // --- Loading States ---
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- Notifications & Modals ---
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const debounceTimerRef = useRef(null);

  // 1. Fetch Summary
  const fetchSummaryData = useCallback(async (activeFilters) => {
    setLoadingSummary(true);
    try {
      const params = {
        period: activeFilters.period,
        ...(activeFilters.startDate && { startDate: activeFilters.startDate }),
        ...(activeFilters.endDate && { endDate: activeFilters.endDate }),
        ...(activeFilters.paymentStatus !== 'all' && { paymentStatus: activeFilters.paymentStatus }),
        ...(activeFilters.paymentGateway !== 'all' && { paymentGateway: activeFilters.paymentGateway }),
      };

      const res = await getFinancialSummary(params);
      const data = res.data?.data || res.data || {};
      setSummary(data);
      setApiError(null);
    } catch (err) {
      console.error('Failed to fetch financial summary:', err);
      setApiError(err.response?.data?.message || 'Unable to fetch financial summary.');
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  // 2. Fetch Revenue Trends
  const fetchRevenueData = useCallback(async (activeFilters, activeInterval) => {
    setLoadingRevenue(true);
    try {
      const params = {
        period: activeFilters.period,
        interval: activeInterval,
        ...(activeFilters.startDate && { startDate: activeFilters.startDate }),
        ...(activeFilters.endDate && { endDate: activeFilters.endDate }),
      };

      const res = await getFinancialRevenueTrends(params);
      const data = res.data?.data || res.data || {};
      const series = data.series || (Array.isArray(data) ? data : []);
      setRevenueSeries(series);
    } catch (err) {
      console.error('Failed to fetch revenue trends:', err);
    } finally {
      setLoadingRevenue(false);
    }
  }, []);

  // 3. Fetch Transactions
  const fetchTransactionsData = useCallback(
    async (activeFilters, page, limit, sort) => {
      setLoadingTransactions(true);
      try {
        const params = {
          page,
          limit,
          sortBy: sort,
          period: activeFilters.period,
          ...(activeFilters.startDate && { startDate: activeFilters.startDate }),
          ...(activeFilters.endDate && { endDate: activeFilters.endDate }),
          ...(activeFilters.paymentStatus !== 'all' && { paymentStatus: activeFilters.paymentStatus }),
          ...(activeFilters.paymentGateway !== 'all' && { paymentGateway: activeFilters.paymentGateway }),
          ...(activeFilters.paymentMethod !== 'all' && { paymentMethod: activeFilters.paymentMethod }),
          ...(activeFilters.searchQuery && {
            // Check if search looks like a numeric ID or Razorpay Payment ID
            ...(activeFilters.searchQuery.startsWith('pay_')
              ? { razorpayPaymentId: activeFilters.searchQuery }
              : !isNaN(Number(activeFilters.searchQuery))
              ? { userId: activeFilters.searchQuery }
              : { razorpayPaymentId: activeFilters.searchQuery }),
          }),
        };

        const res = await getFinancialTransactions(params);
        const data = res.data?.data || res.data || {};
        const list = data.transactions || (Array.isArray(data) ? data : []);
        setTransactions(list);

        const pag = data.pagination || {};
        const totalRecords = pag.total_records ?? list.length;
        const totalPages = pag.total_pages ?? (Math.ceil(totalRecords / limit) || 1);

        setPagination((prev) => ({
          ...prev,
          page: pag.page || page,
          limit: pag.limit || limit,
          total_records: totalRecords,
          total_pages: totalPages,
        }));

        setFilteredTotals(data.filtered_totals || {});
      } catch (err) {
        console.error('Failed to fetch financial transactions:', err);
      } finally {
        setLoadingTransactions(false);
      }
    },
    []
  );

  // Trigger initial fetch & when filter or interval changes
  useEffect(() => {
    fetchSummaryData(filters);
    fetchRevenueData(filters, interval);
    setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
  }, [filters.period, filters.startDate, filters.endDate, filters.paymentStatus, filters.paymentGateway, interval, fetchSummaryData, fetchRevenueData]);

  // Fetch transactions when pagination, sorting, or filters change
  useEffect(() => {
    fetchTransactionsData(filters, pagination.page, pagination.limit, sortBy);
  }, [filters, pagination.page, pagination.limit, sortBy, fetchTransactionsData]);

  // Refresh All Data Handler
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchSummaryData(filters),
        fetchRevenueData(filters, interval),
        fetchTransactionsData(filters, pagination.page, pagination.limit, sortBy),
      ]);
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Sync Razorpay Fees Handler
  const handleSyncRazorpay = async () => {
    setIsSyncing(true);
    try {
      const res = await syncRazorpayReconciliation({ limit: 50, forceRecheck: false });
      const data = res.data?.data || res.data || {};
      setLastSyncResult({
        success: true,
        message: data.message || 'Razorpay platform fees and reconciliation successfully synced!',
      });
      // Refresh all calculations to reflect verified fees
      await handleRefreshAll();
    } catch (err) {
      console.error('Failed to sync Razorpay reconciliation:', err);
      setLastSyncResult({
        success: false,
        message:
          err.response?.data?.message || 'Unable to sync with Razorpay API. Please try again.',
      });
    } finally {
      setIsSyncing(false);
      // Auto clear banner after 6 seconds
      setTimeout(() => setLastSyncResult(null), 6000);
    }
  };

  // Filter change handler (resets page to 1)
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="financial-dashboard-page">
      {/* Page Header */}
      <div className="financial-header-card">
        <div className="header-left-col">
          <div className="header-icon-box">
            <BadgeIndianRupee size={28} />
          </div>
          <div>
            <div className="header-badge-row">
              <h1 className="header-main-title">Financial & Revenue Analytics</h1>
              <span className="live-badge">
                <span className="pulse-dot" />
                Live Settlement Data
              </span>
            </div>
            <p className="header-main-sub">
              Monitor gross customer revenue, 2% + 18% GST Razorpay deductions, and true net
              in-hand bank receipts.
            </p>
          </div>
        </div>

        <div className="header-right-col">
          <div className="last-sync-tag">
            <Clock size={14} />
            <span>Updated at {lastUpdated || 'just now'}</span>
          </div>
        </div>
      </div>

      {/* Global Error Banner if API Fails */}
      {apiError && (
        <div className="financial-error-banner">
          <AlertCircle size={20} className="error-icon" />
          <div className="error-text">
            <strong>Error connecting to financial analytics:</strong> {apiError}
          </div>
          <button type="button" className="retry-btn" onClick={handleRefreshAll}>
            Retry Now
          </button>
        </div>
      )}

      {/* Filter and Action Bar */}
      <FinancialFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefreshAll}
        onSyncRazorpay={handleSyncRazorpay}
        isRefreshing={isRefreshing}
        isSyncing={isSyncing}
        lastSyncResult={lastSyncResult}
      />

      {/* Summary KPI Cards Grid */}
      <FinancialSummaryCards summary={summary} loading={loadingSummary} />

      {/* Revenue Trends Chart */}
      <RevenueTrendChart
        series={revenueSeries}
        interval={interval}
        onIntervalChange={setInterval}
        loading={loadingRevenue}
      />

      {/* Transactions Data Table */}
      <TransactionTable
        transactions={transactions}
        filteredTotals={filteredTotals}
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onSortChange={handleSortChange}
        currentSort={sortBy}
        onSelectTransaction={setSelectedTransaction}
        loading={loadingTransactions}
        onResetFilters={() =>
          handleFilterChange({
            period: 'last_30_days',
            startDate: '',
            endDate: '',
            paymentStatus: 'all',
            paymentGateway: 'all',
            paymentMethod: 'all',
            searchQuery: '',
          })
        }
      />

      {/* Slide-over Transaction Details Drawer */}
      {selectedTransaction && (
        <TransactionDetailDrawer
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}

export default FinancialDashboard;
