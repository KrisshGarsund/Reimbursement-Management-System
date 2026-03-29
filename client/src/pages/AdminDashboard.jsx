import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/axios.js';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import AiBadge from '../components/ui/AiBadge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import { TableSkeleton } from '../components/ui/Skeleton.jsx';
import { formatCurrency, formatDate, getCategoryIcon, getInitials } from '../utils/formatters.js';
import { CATEGORIES } from '../utils/constants.js';
import { Download, Filter, Plus, Users, Shield, CheckCircle, XCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', startDate: '', endDate: '' });
  const [showOverride, setShowOverride] = useState(null);
  const [overrideAction, setOverrideAction] = useState('APPROVED');
  const [overrideComment, setOverrideComment] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchExpenses(); }, []);

  async function fetchExpenses() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.category) params.set('category', filters.category);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      const { data } = await api.get(`/expenses?${params.toString()}`);
      setExpenses(data.data.expenses || []);
    } catch {} finally { setLoading(false); }
  }

  async function handleExportCSV() {
    try {
      const response = await api.get('/expenses/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'expenses.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported!');
    } catch { toast.error('Export failed'); }
  }

  async function handleOverride() {
    setProcessing(true);
    try {
      await api.post(`/expenses/${showOverride.id}/override`, { action: overrideAction, comment: overrideComment });
      toast.success(`Expense ${overrideAction.toLowerCase()}!`);
      setShowOverride(null);
      setOverrideComment('');
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Override failed');
    } finally { setProcessing(false); }
  }

  const handleFilterApply = () => fetchExpenses();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Expenses</h1>
          <p className="text-gray-500 text-sm mt-1">View and manage all company expenses</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportCSV} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: expenses.length, color: 'bg-gray-50 text-gray-900' },
          { label: 'Pending', value: expenses.filter((e) => e.status === 'PENDING' || e.status === 'IN_REVIEW').length, color: 'bg-blue-50 text-blue-700' },
          { label: 'Approved', value: expenses.filter((e) => e.status === 'APPROVED').length, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Rejected', value: expenses.filter((e) => e.status === 'REJECTED').length, color: 'bg-red-50 text-red-700' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-xl px-4 py-3 border border-transparent`}>
            <p className="text-xs font-medium opacity-70">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
              <option value="">All</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <button onClick={handleFilterApply} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
            <Filter className="w-4 h-4" /> Apply
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={8} /></div>
        ) : expenses.length === 0 ? (
          <EmptyState title="No expenses found" description="Try adjusting your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">AI</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                          {getInitials(exp.submittedBy?.name)}
                        </div>
                        <Link to={`/expenses/${exp.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600">{exp.submittedBy?.name}</Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(exp.convertedAmount || exp.amount, exp.companyCurrency)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{getCategoryIcon(exp.category)} {exp.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 hidden md:table-cell">{formatDate(exp.date)}</td>
                    <td className="px-4 py-3"><StatusBadge status={exp.status} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell">{exp.aiFlag && <AiBadge severity={exp.aiSeverity} reasoning={exp.aiReasoning} />}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/expenses/${exp.id}`} className="px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">View</Link>
                        {(exp.status === 'PENDING' || exp.status === 'IN_REVIEW') && (
                          <button onClick={() => setShowOverride(exp)} className="px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Override
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Override Modal */}
      <Modal isOpen={!!showOverride} onClose={() => { setShowOverride(null); setOverrideComment(''); }} title="Admin Override">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800">
            ⚠️ This will override the normal approval workflow.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select value={overrideAction} onChange={(e) => setOverrideAction(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
              <option value="APPROVED">Approve</option>
              <option value="REJECTED">Reject</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
            <textarea value={overrideComment} onChange={(e) => setOverrideComment(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none" rows={3} placeholder="Reason for override..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowOverride(null); setOverrideComment(''); }} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleOverride} disabled={processing} className="flex-1 bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center">
              {processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Override'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
