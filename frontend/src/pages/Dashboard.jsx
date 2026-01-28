import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { transactionsAPI, categoriesAPI, budgetsAPI, recurringAPI } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  LogOut,
  RefreshCw,
  AlertTriangle,
  Target,
  Calendar,
  Clock
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [upcomingRecurring, setUpcomingRecurring] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Seed categories if needed
      await categoriesAPI.seed();
      
      // Load summary, recent transactions, budgets, and upcoming recurring
      const [summaryRes, transactionsRes, budgetsRes, upcomingRes] = await Promise.all([
        transactionsAPI.getSummary(),
        transactionsAPI.getAll(),
        budgetsAPI.getAll(),
        recurringAPI.getUpcoming(),
      ]);
      
      setSummary(summaryRes.data);
      setTransactions(transactionsRes.data.slice(0, 5)); // Last 5 transactions
      setBudgets(budgetsRes.data);
      setUpcomingRecurring(upcomingRes.data.slice(0, 5)); // Next 5 upcoming
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const chartData = summary?.expensesByCategory?.map((item) => ({
    name: item.categoryName,
    value: item.total,
    color: item.categoryColor,
    icon: item.categoryIcon,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SmartWallet</h1>
            <p className="text-gray-600">Welcome back, {user?.name || user?.email}!</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/transactions')}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition text-sm font-medium"
            >
              Transactions
            </button>
            <button
              onClick={() => navigate('/budgets')}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition text-sm font-medium"
            >
              Budgets
            </button>
            <button
              onClick={() => navigate('/recurring')}
              className="px-3 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition text-sm font-medium flex items-center gap-1"
            >
              <Calendar className="w-4 h-4" />
              Recurring
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button
              onClick={loadData}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Balance</p>
                <p className={`text-3xl font-bold ${summary?.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                  {formatCurrency(summary?.balance || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(summary?.totalIncome || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(summary?.totalExpenses || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expenses by Category Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <p>No expense data yet. Add some transactions!</p>
              </div>
            )}
          </div>

          {/* Budget Status */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Budget Status</h2>
              <button
                onClick={() => navigate('/budgets')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Manage Budgets
              </button>
            </div>
            
            {budgets.length > 0 ? (
              <div className="space-y-4">
                {budgets.slice(0, 4).map((budget) => (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{budget.category?.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{budget.category?.name}</span>
                        {budget.status === 'exceeded' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Exceeded</span>
                        )}
                        {budget.status === 'warning' && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Warning</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          budget.status === 'exceeded' ? 'bg-red-500' :
                          budget.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {budgets.length > 4 && (
                  <button
                    onClick={() => navigate('/budgets')}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    View {budgets.length - 4} more budgets
                  </button>
                )}
              </div>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-gray-500">
                <Target className="w-12 h-12 text-gray-300 mb-2" />
                <p className="mb-2">No budgets set</p>
                <button
                  onClick={() => navigate('/budgets')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Create a budget
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Budget Alerts */}
        {budgets.filter(b => b.status !== 'ok').length > 0 && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">Budget Alerts</h3>
            </div>
            <div className="space-y-2">
              {budgets.filter(b => b.status !== 'ok').map((budget) => (
                <div key={budget.id} className="flex items-center justify-between text-sm">
                  <span className="text-yellow-800">
                    {budget.category?.icon} {budget.category?.name}: {budget.percentage.toFixed(0)}% used
                  </span>
                  <span className={budget.status === 'exceeded' ? 'text-red-600 font-medium' : 'text-yellow-700'}>
                    {budget.status === 'exceeded' 
                      ? `${formatCurrency(Math.abs(budget.remaining))} over budget`
                      : `${formatCurrency(budget.remaining)} left`
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Recurring Transactions */}
        {upcomingRecurring.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Recurring</h2>
              </div>
              <button
                onClick={() => navigate('/recurring')}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                Manage
              </button>
            </div>
            <div className="space-y-3">
              {upcomingRecurring.map((item) => {
                const daysUntil = Math.ceil((new Date(item.nextDate) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.category?.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {item.description || item.category?.name}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {daysUntil <= 0 ? (
                            <span className="text-red-500 font-medium">Due!</span>
                          ) : daysUntil === 1 ? (
                            <span>Tomorrow</span>
                          ) : (
                            <span>In {daysUntil} days</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className={`font-semibold text-sm ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <button
              onClick={() => navigate('/transactions')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </button>
          </div>
          
          {transactions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{transaction.category?.icon || '📦'}</span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {transaction.description || transaction.category?.name}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                    </div>
                  </div>
                  <p className={`font-semibold text-sm ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[100px] flex items-center justify-center text-gray-500">
              <p>No transactions yet.</p>
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

export default Dashboard;
