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
import { formatCurrency, formatDate, getCategoryIcon, getInitials } from '../utils/formatters.js';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState({ isOpen: false, type: null, expense: null });
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchExpenses(); }, []);

  async function fetchExpenses() {
    try {
      const { data } = await api.get('/expenses');
      setExpenses(data.data.expenses || []);
    } catch {} finally { setLoading(false); }
  }

  const pendingExpenses = expenses.filter((e) => e.status === 'PENDING' || e.status === 'IN_REVIEW');
  const completedExpenses = expenses.filter((e) => e.status === 'APPROVED' || e.status === 'REJECTED');

  async function handleAction() {
    setProcessing(true);
    try {
      const { type, expense } = actionModal;
      if (type === 'reject' && !comment.trim()) {
        toast.error('Comment is required for rejection');
        setProcessing(false);
        return;
      }
      const endpoint = type === 'approve' ? 'approve' : 'reject';
      await api.post(`/expenses/${expense.id}/${endpoint}`, { comment });
      toast.success(`Expense ${type === 'approve' ? 'approved' : 'rejected'}!`);
      setActionModal({ isOpen: false, type: null, expense: null });
      setComment('');
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally { setProcessing(false); }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Approval Queue</h1>
        <p className="text-gray-500 text-sm mt-1">Review and approve team expense submissions</p>
      </div>

      {/* Pending Section */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-900">Pending Approval ({pendingExpenses.length})</h2>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : pendingExpenses.length === 0 ? (
          <EmptyState title="All caught up!" description="No expenses pending your approval." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingExpenses.map((exp) => (
              <div key={exp.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                      {getInitials(exp.submittedBy?.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{exp.submittedBy?.name}</p>
                      <p className="text-xs text-gray-400">{formatDate(exp.date)}</p>
                    </div>
                  </div>
                  <StatusBadge status={exp.status} />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getCategoryIcon(exp.category)}</span>
                  <span className="text-sm text-gray-600">{exp.category}</span>
                </div>

                <p className="text-xl font-bold text-gray-900 mb-1">
                  {formatCurrency(exp.convertedAmount || exp.amount, exp.companyCurrency || exp.currency)}
                </p>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{exp.description}</p>

                {exp.aiFlag && (
                  <div className="mb-3">
                    <AiBadge severity={exp.aiSeverity} reasoning={exp.aiReasoning} />
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => setActionModal({ isOpen: true, type: 'approve', expense: exp })}
                    className="flex-1 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => setActionModal({ isOpen: true, type: 'reject', expense: exp })}
                    className="flex-1 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <Link to={`/expenses/${exp.id}`} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Section */}
      {completedExpenses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">History</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {completedExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/expenses/${exp.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600">{exp.submittedBy?.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(exp.convertedAmount || exp.amount, exp.companyCurrency)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{getCategoryIcon(exp.category)} {exp.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 hidden md:table-cell">{formatDate(exp.date)}</td>
                    <td className="px-4 py-3"><StatusBadge status={exp.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Modal */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => { setActionModal({ isOpen: false, type: null, expense: null }); setComment(''); }}
        title={actionModal.type === 'approve' ? 'Approve Expense' : 'Reject Expense'}
      >
        <div className="space-y-4">
          {actionModal.expense && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Amount</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(actionModal.expense.convertedAmount || actionModal.expense.amount, actionModal.expense.companyCurrency)}
              </p>
              <p className="text-sm text-gray-500 mt-1">{actionModal.expense.description}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment {actionModal.type === 'reject' && <span className="text-red-500">*</span>}
            </label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              rows={3} placeholder={actionModal.type === 'reject' ? 'Reason for rejection (required)...' : 'Optional comment...'} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setActionModal({ isOpen: false, type: null, expense: null }); setComment(''); }}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleAction} disabled={processing}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center ${
                actionModal.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }`}>
              {processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : actionModal.type === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
