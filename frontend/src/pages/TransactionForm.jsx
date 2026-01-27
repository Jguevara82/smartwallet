import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { transactionsAPI, categoriesAPI } from '../services/api';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

const TransactionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      // Seed and load categories
      await categoriesAPI.seed();
      const categoriesRes = await categoriesAPI.getAll();
      setCategories(categoriesRes.data);

      // If editing, load the transaction
      if (isEditing) {
        const transactionRes = await transactionsAPI.getById(id);
        const transaction = transactionRes.data;
        setFormData({
          type: transaction.type,
          amount: transaction.amount.toString(),
          description: transaction.description || '',
          categoryId: transaction.categoryId,
          date: new Date(transaction.date).toISOString().split('T')[0],
        });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset category when type changes
      ...(name === 'type' && { categoryId: '' }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      if (isEditing) {
        await transactionsAPI.update(id, data);
      } else {
        await transactionsAPI.create(data);
      }

      navigate('/transactions');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Transaction' : 'New Transaction'}
              </h1>
              <p className="text-gray-600">
                {isEditing ? 'Update your transaction details' : 'Add a new income or expense'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Transaction Type
              </label>
              <div className="flex gap-4">
                <label className="flex-1">
                  <input
                    type="radio"
                    name="type"
                    value="expense"
                    checked={formData.type === 'expense'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`p-4 rounded-lg border-2 cursor-pointer text-center transition ${
                    formData.type === 'expense'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <span className="text-2xl mb-2 block">💸</span>
                    <span className="font-medium">Expense</span>
                  </div>
                </label>
                <label className="flex-1">
                  <input
                    type="radio"
                    name="type"
                    value="income"
                    checked={formData.type === 'income'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`p-4 rounded-lg border-2 cursor-pointer text-center transition ${
                    formData.type === 'income'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <span className="text-2xl mb-2 block">💰</span>
                    <span className="font-medium">Income</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0.01"
                  className="w-full pl-8 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredCategories.map((category) => (
                  <label key={category.id}>
                    <input
                      type="radio"
                      name="categoryId"
                      value={category.id}
                      checked={formData.categoryId === category.id}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div
                      className={`p-3 rounded-lg border-2 cursor-pointer text-center transition ${
                        formData.categoryId === category.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{
                        borderColor: formData.categoryId === category.id ? category.color : undefined,
                        backgroundColor: formData.categoryId === category.id ? `${category.color}15` : undefined,
                      }}
                    >
                      <span className="text-xl">{category.icon}</span>
                      <p className="text-sm font-medium mt-1 truncate">{category.name}</p>
                    </div>
                  </label>
                ))}
              </div>
              {filteredCategories.length === 0 && (
                <p className="text-gray-500 text-center py-4">No categories available.</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g., Grocery shopping at Walmart"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.categoryId}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEditing ? 'Update Transaction' : 'Save Transaction'}
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default TransactionForm;
