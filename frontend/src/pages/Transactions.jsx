import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { transactionsAPI, categoriesAPI } from '../services/api';
import {
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
} from 'lucide-react';

const Transactions = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Data
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Load categories once
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoriesAPI.getAll();
        setCategories(res.data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Build params and load transactions
  const loadTransactions = useCallback(async (currentPage) => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: 20, sortBy, sortOrder };
      if (typeFilter !== 'all') params.type = typeFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (minAmount) params.minAmount = minAmount;
      if (maxAmount) params.maxAmount = maxAmount;

      const response = await transactionsAPI.getAll(params);
      setTransactions(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, categoryFilter, searchTerm, startDate, endDate, minAmount, maxAmount, sortBy, sortOrder]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    loadTransactions(1);
  }, [typeFilter, categoryFilter, startDate, endDate, minAmount, maxAmount, sortBy, sortOrder]);

  // Load when page changes (but not on filter change, handled above)
  useEffect(() => {
    loadTransactions(page);
  }, [page]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadTransactions(1);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await transactionsAPI.delete(id);
      loadTransactions(page);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCategoryFilter('');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('date');
    setSortOrder('desc');
    setPage(1);
  };

  const hasActiveFilters =
    searchTerm || typeFilter !== 'all' || categoryFilter || startDate || endDate || minAmount || maxAmount;

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Filter categories based on selected type
  const filteredCategories =
    typeFilter !== 'all' ? categories.filter((c) => c.type === typeFilter) : categories;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
              <p className="text-gray-600">Manage your income and expenses</p>
            </div>
            {pagination.total > 0 && (
              <span className="text-sm text-gray-500">
                {pagination.total} transaction{pagination.total !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search + Type Filter Row */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Type Buttons */}
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All', activeClass: 'bg-blue-600 text-white' },
                { value: 'income', label: 'Income', activeClass: 'bg-green-600 text-white' },
                { value: 'expense', label: 'Expenses', activeClass: 'bg-red-600 text-white' },
              ].map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setTypeFilter(btn.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    typeFilter === btn.value ? btn.activeClass : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Toggle Advanced Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">All categories</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                  </select>
                  <button
                    onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="$0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="No limit"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length > 0 ? (
            <>
              {/* Table header - desktop */}
              <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                <div className="col-span-5">Description</div>
                <div className="col-span-2">Category</div>
                <div
                  className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-700"
                  onClick={() => toggleSort('date')}
                >
                  Date
                  {sortBy === 'date' && <ArrowUpDown className="w-3 h-3" />}
                </div>
                <div
                  className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-700 justify-end"
                  onClick={() => toggleSort('amount')}
                >
                  Amount
                  {sortBy === 'amount' && <ArrowUpDown className="w-3 h-3" />}
                </div>
                <div className="col-span-1" />
              </div>

              <div className="divide-y divide-gray-100">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 hover:bg-gray-50 transition"
                  >
                    {/* Desktop row */}
                    <div className="hidden sm:grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-5 flex items-center gap-3">
                        <span className="text-2xl">{transaction.category?.icon || '??'}</span>
                        <p className="font-medium text-gray-900 truncate">
                          {transaction.description || transaction.category?.name}
                        </p>
                      </div>
                      <div className="col-span-2 text-sm text-gray-500">
                        {transaction.category?.name}
                      </div>
                      <div className="col-span-2 text-sm text-gray-500">
                        {formatDate(transaction.date)}
                      </div>
                      <div className="col-span-2 text-right">
                        <span
                          className={`font-bold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                      <div className="col-span-1 flex justify-end gap-1">
                        <button
                          onClick={() => navigate(`/transactions/edit/${transaction.id}`)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Mobile row */}
                    <div className="sm:hidden flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{transaction.category?.icon || '??'}</span>
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.description || transaction.category?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {transaction.category?.name} • {formatDate(transaction.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p
                          className={`font-bold text-lg ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => navigate(`/transactions/edit/${transaction.id}`)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                  <p className="text-sm text-gray-600">
                    Showing {(pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page <= 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {/* Page numbers */}
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter((p) => {
                        return p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1;
                      })
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === '...' ? (
                          <span key={`dots-${idx}`} className="px-2 text-gray-400">
                            ...
                          </span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => setPage(item)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                              pagination.page === item
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-white text-gray-700'
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={pagination.page >= pagination.totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              {hasActiveFilters ? (
                <>
                  <p>No transactions match your filters.</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <p>No transactions found.</p>
                  <button
                    onClick={() => navigate('/transactions/new')}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Add your first transaction
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Add Transaction FAB */}
        <button
          onClick={() => navigate('/transactions/new')}
          className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition transform hover:scale-105"
        >
          <Plus className="w-6 h-6" />
        </button>
      </main>
    </div>
  );
};

export default Transactions;
