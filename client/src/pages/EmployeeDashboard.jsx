import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/axios.js';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import AiBadge from '../components/ui/AiBadge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';
import { formatCurrency, formatDate, getCategoryIcon } from '../utils/formatters.js';
import { CATEGORIES } from '../utils/constants.js';
import { Plus, Upload, Search, ScanLine } from 'lucide-react';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [convertedPreview, setConvertedPreview] = useState(null);
  const [form, setForm] = useState({
    amount: '', currency: user?.companyCurrency || 'USD', category: 'OTHER',
    description: '', date: new Date().toISOString().split('T')[0], receipt: null,
  });

  useEffect(() => { fetchExpenses(); }, []);

  async function fetchExpenses() {
    try {
      const { data } = await api.get('/expenses');
      setExpenses(data.data.expenses || []);
    } catch {} finally { setLoading(false); }
  }

  async function handleConvert(amount, currency) {
    if (!amount || !currency || currency === user?.companyCurrency) {
      setConvertedPreview(null);
      return;
    }
    try {
      const { data } = await api.get(`/expenses/convert?amount=${amount}&from=${currency}&to=${user.companyCurrency}`);
      setConvertedPreview(data.data);
    } catch { setConvertedPreview(null); }
  }

  async function handleOCR(file) {
    setOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      const { data } = await api.post('/ocr', formData);
      if (data.data) {
        setForm((prev) => ({
          ...prev,
          amount: data.data.amount?.toString() || prev.amount,
          currency: data.data.currency || prev.currency,
          category: data.data.category || prev.category,
          description: data.data.description || data.data.vendor || prev.description,
          date: data.data.date || prev.date,
        }));
        toast.success('Receipt scanned successfully!');
      }
    } catch { toast.error('OCR scan failed'); }
    finally { setOcrLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'receipt') { if (value) formData.append('receipt', value); }
        else formData.append(key, value);
      });
      await api.post('/expenses', formData);
      toast.success('Expense submitted!');
      setShowForm(false);
      setForm({ amount: '', currency: user?.companyCurrency || 'USD', category: 'OTHER', description: '', date: new Date().toISOString().split('T')[0], receipt: null });
      setConvertedPreview(null);
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally { setSubmitting(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Expenses</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage your expense submissions</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> New Expense
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState
          title="No expenses yet"
          description="Submit your first expense to get started."
          action={<button onClick={() => setShowForm(true)} className="text-indigo-600 font-medium text-sm hover:text-indigo-700">+ New Expense</button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {expenses.map((exp) => (
            <Link to={`/expenses/${exp.id}`} key={exp.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryIcon(exp.category)}</span>
                  <span className="text-sm font-medium text-gray-600">{exp.category}</span>
                </div>
                <StatusBadge status={exp.status} />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-1">
                {formatCurrency(exp.convertedAmount || exp.amount, exp.companyCurrency || exp.currency)}
              </p>
              {exp.currency !== exp.companyCurrency && (
                <p className="text-xs text-gray-400">Original: {formatCurrency(exp.amount, exp.currency)}</p>
              )}
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{exp.description}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <span className="text-xs text-gray-400">{formatDate(exp.date)}</span>
                {exp.aiFlag && <AiBadge severity={exp.aiSeverity} reasoning={exp.aiReasoning} />}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Expense Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Submit Expense" maxWidth="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* OCR Button */}
          <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ScanLine className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Scan Receipt</p>
                <p className="text-xs text-gray-500">Upload a receipt image to auto-fill</p>
              </div>
              <input type="file" className="hidden" accept="image/*"
                onChange={(e) => { if (e.target.files[0]) { setForm({ ...form, receipt: e.target.files[0] }); handleOCR(e.target.files[0]); } }} />
              {ocrLoading && <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin ml-auto" />}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input type="number" step="0.01" value={form.amount} required
                onChange={(e) => { setForm({ ...form, amount: e.target.value }); handleConvert(e.target.value, form.currency); }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input type="text" value={form.currency} required maxLength={3}
                onChange={(e) => { setForm({ ...form, currency: e.target.value.toUpperCase() }); handleConvert(form.amount, e.target.value.toUpperCase()); }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="USD" />
            </div>
          </div>

          {convertedPreview && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 text-sm">
              <span className="text-emerald-700">≈ {formatCurrency(convertedPreview.converted, user.companyCurrency)}</span>
              <span className="text-emerald-500 ml-2 text-xs">in company currency</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white">
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              rows={3} placeholder="Describe the expense..." required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" required />
          </div>

          {!form.receipt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receipt (optional)</label>
              <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors">
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Upload receipt image</span>
                <input type="file" className="hidden" accept="image/*,application/pdf"
                  onChange={(e) => setForm({ ...form, receipt: e.target.files[0] })} />
              </label>
            </div>
          )}

          {form.receipt && (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
              <span className="text-sm text-gray-700 truncate">{form.receipt.name}</span>
              <button type="button" onClick={() => setForm({ ...form, receipt: null })} className="text-xs text-red-500 hover:text-red-700">Remove</button>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
