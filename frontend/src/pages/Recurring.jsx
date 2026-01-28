import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar,
  PlayCircle,
  PauseCircle,
  SkipForward,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  X
} from 'lucide-react';
import { recurringAPI, categoriesAPI } from '../services/api';

const frequencyLabels = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export default function Recurring() {
  const [recurring, setRecurring] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    type: 'expense',
    categoryId: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recurringRes, categoriesRes] = await Promise.all([
        recurringAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setRecurring(recurringRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      setError('Error loading data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        endDate: formData.endDate || null,
      };

      if (editingRecurring) {
        await recurringAPI.update(editingRecurring.id, data);
      } else {
        await recurringAPI.create(data);
      }

      setShowModal(false);
      setEditingRecurring(null);
      resetForm();
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving recurring transaction');
    }
  };

  const handleEdit = (item) => {
    setEditingRecurring(item);
    setFormData({
      amount: item.amount.toString(),
      description: item.description || '',
      type: item.type,
      categoryId: item.categoryId,
      frequency: item.frequency,
      startDate: new Date(item.startDate).toISOString().split('T')[0],
      endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this recurring transaction?')) return;

    try {
      await recurringAPI.delete(id);
      loadData();
    } catch (err) {
      setError('Error deleting recurring transaction');
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await recurringAPI.update(item.id, { isActive: !item.isActive });
      loadData();
    } catch (err) {
      setError('Error updating status');
    }
  };

  const handleSkip = async (id) => {
    try {
      await recurringAPI.skip(id);
      loadData();
    } catch (err) {
      setError('Error skipping occurrence');
    }
  };

  const handleProcess = async () => {
    try {
      setProcessing(true);
      const result = await recurringAPI.process();
      alert(`Generated ${result.data.generatedCount} transactions`);
      loadData();
    } catch (err) {
      setError('Error processing recurring transactions');
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      type: 'expense',
      categoryId: '',
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    });
  };

  const openNewModal = () => {
    setEditingRecurring(null);
    resetForm();
    setShowModal(true);
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysUntil = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">
              <RefreshCw className="inline mr-2 text-purple-600" size={24} />
              Recurring Transactions
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleProcess}
              disabled={processing}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
            >
              <PlayCircle size={20} />
              {processing ? 'Processing...' : 'Process Pending'}
            </button>
            <button
              onClick={openNewModal}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus size={20} />
              New Recurring
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Total Active</p>
            <p className="text-2xl font-bold text-purple-600">
              {recurring.filter(r => r.isActive).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Monthly Income</p>
            <p className="text-2xl font-bold text-green-600">
              ${recurring
                .filter(r => r.isActive && r.type === 'income' && r.frequency === 'monthly')
                .reduce((sum, r) => sum + r.amount, 0)
                .toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Monthly Expenses</p>
            <p className="text-2xl font-bold text-red-600">
              ${recurring
                .filter(r => r.isActive && r.type === 'expense' && r.frequency === 'monthly')
                .reduce((sum, r) => sum + r.amount, 0)
                .toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Next 7 Days</p>
            <p className="text-2xl font-bold text-blue-600">
              {recurring.filter(r => r.isActive && getDaysUntil(r.nextDate) <= 7 && getDaysUntil(r.nextDate) >= 0).length}
            </p>
          </div>
        </div>

        {/* Recurring Transactions List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Next Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recurring.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No recurring transactions configured
                  </td>
                </tr>
              ) : (
                recurring.map((item) => {
                  const daysUntil = getDaysUntil(item.nextDate);
                  return (
                    <tr key={item.id} className={!item.isActive ? 'bg-gray-50 opacity-60' : ''}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.category?.icon}</span>
                          <div>
                            <p className="font-medium text-gray-800">
                              {item.description || item.category?.name}
                            </p>
                            <p className="text-sm text-gray-500">{item.category?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {item.type === 'income' ? (
                            <ArrowUpCircle size={16} className="text-green-500" />
                          ) : (
                            <ArrowDownCircle size={16} className="text-red-500" />
                          )}
                          <span className={`font-semibold ${
                            item.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${item.amount.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                          {frequencyLabels[item.frequency]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          <div>
                            <p className="text-gray-800">{formatDate(item.nextDate)}</p>
                            {item.isActive && (
                              <p className={`text-xs ${
                                daysUntil <= 0 ? 'text-red-500 font-medium' :
                                daysUntil <= 3 ? 'text-orange-500' : 'text-gray-500'
                              }`}>
                                {daysUntil <= 0 ? 'Due!' : 
                                 daysUntil === 1 ? 'Tomorrow' : 
                                 `In ${daysUntil} days`}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.isActive ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1 w-fit">
                            <Clock size={14} />
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-sm flex items-center gap-1 w-fit">
                            <PauseCircle size={14} />
                            Paused
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSkip(item.id)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                            title="Skip next"
                          >
                            <SkipForward size={18} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(item)}
                            className={`p-2 rounded-lg ${
                              item.isActive 
                                ? 'text-yellow-600 hover:bg-yellow-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={item.isActive ? 'Pause' : 'Activate'}
                          >
                            {item.isActive ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingRecurring ? 'Edit Recurring' : 'New Recurring'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense', categoryId: '' })}
                  className={`flex-1 py-2 rounded-lg font-medium transition ${
                    formData.type === 'expense'
                      ? 'bg-red-100 text-red-700 border-2 border-red-500'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income', categoryId: '' })}
                  className={`flex-1 py-2 rounded-lg font-medium transition ${
                    formData.type === 'income'
                      ? 'bg-green-100 text-green-700 border-2 border-green-500'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Income
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Netflix, Salary, Rent..."
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  required
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* End Date (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (optional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition"
              >
                {editingRecurring ? 'Save Changes' : 'Create Recurring'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
