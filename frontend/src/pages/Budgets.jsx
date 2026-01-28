import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { budgetsAPI, categoriesAPI } from '../services/api';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const Budgets = () => {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    period: 'monthly',
    alertThreshold: '0.8',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [budgetsRes, categoriesRes] = await Promise.all([
        budgetsAPI.getAll(),
        categoriesAPI.getAll('expense'),
      ]);
      setBudgets(budgetsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      if (editingBudget) {
        await budgetsAPI.update(editingBudget.id, formData);
      } else {
        await budgetsAPI.create(formData);
      }
      setShowForm(false);
      setEditingBudget(null);
      resetForm();
      loadData();
    } catch (error) {
      setFormError(error.response?.data?.error || 'Failed to save budget.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      categoryId: budget.categoryId,
      amount: budget.amount.toString(),
      period: budget.period,
      alertThreshold: budget.alertThreshold.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;

    try {
      await budgetsAPI.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      categoryId: '',
      amount: '',
      period: 'monthly',
      alertThreshold: '0.8',
    });
    setFormError('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'exceeded':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'exceeded':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const usedCategoryIds = budgets
    .filter(b => b.period === formData.period && b.id !== editingBudget?.id)
    .map(b => b.categoryId);

  const availableCategories = categories.filter(
    c => !usedCategoryIds.includes(c.id)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
                <p className="text-gray-600">Set spending limits by category</p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingBudget(null);
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              New Budget
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Budget Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingBudget ? 'Edit Budget' : 'Create Budget'}
              </h2>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                    disabled={!!editingBudget}
                  >
                    <option value="">Select a category</option>
                    {(editingBudget ? categories : availableCategories).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="500"
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period
                  </label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={!!editingBudget}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alert Threshold
                  </label>
                  <select
                    value={formData.alertThreshold}
                    onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="0.5">50% - Early warning</option>
                    <option value="0.7">70% - Standard</option>
                    <option value="0.8">80% - Default</option>
                    <option value="0.9">90% - Late warning</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    You'll see a warning when spending reaches this percentage
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingBudget(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {formLoading ? 'Saving...' : editingBudget ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Budget Cards */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : budgets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => (
              <div
                key={budget.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{budget.category?.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{budget.category?.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{budget.period}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(budget.status)}
                    <button
                      onClick={() => handleEdit(budget)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      {formatCurrency(budget.spent)} spent
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(budget.amount)}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressColor(budget.status)}`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between text-sm">
                  <span className={budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {budget.remaining >= 0 
                      ? `${formatCurrency(budget.remaining)} left`
                      : `${formatCurrency(Math.abs(budget.remaining))} over`
                    }
                  </span>
                  <span className="text-gray-500">
                    {budget.percentage.toFixed(0)}% used
                  </span>
                </div>

                {/* Alert Message */}
                {budget.status === 'exceeded' && (
                  <div className="mt-3 p-2 bg-red-50 rounded-lg text-red-700 text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                    Budget exceeded!
                  </div>
                )}
                {budget.status === 'warning' && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded-lg text-yellow-700 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    Approaching limit ({budget.percentage.toFixed(0)}%)
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets yet</h3>
            <p className="text-gray-500 mb-4">
              Create budgets to track your spending by category
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              Create your first budget
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Budgets;
