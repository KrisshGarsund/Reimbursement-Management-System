import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/axios.js';
import Modal from '../components/ui/Modal.jsx';
import { formatCurrency } from '../utils/formatters.js';
import { Check, X, AlertTriangle } from 'lucide-react';

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

  // Exclude own expenses from pending queue — manager cannot self-approve
  const pendingExpenses = expenses.filter(
    (e) => (e.status === 'PENDING' || e.status === 'IN_REVIEW') && e.submittedBy?.id !== user?.id
  );
  const completedExpenses = expenses.filter((e) => e.status === 'APPROVED' || e.status === 'REJECTED');

  async function handleAction(e) {
    if (e) e.preventDefault();
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

  const CategoryBadge = ({ category }) => (
    <span className="bg-brand-bg text-[#4F54A4] px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">{category || 'GENERAL'}</span>
  );

  const StatusBadge = ({ status }) => {
    switch(status) {
      case 'APPROVED': return <span className="bg-[#D1FAE5] text-[#059669] px-3 py-1 rounded-full text-[11px] font-bold">APPROVED</span>;
      case 'PENDING': case 'IN_REVIEW': return <span className="bg-[#E0E7FF] text-[#4F46E5] px-3 py-1 rounded-full text-[11px] font-bold">PENDING</span>;
      case 'REJECTED': return <span className="bg-[#FEE2E2] text-[#DC2626] px-3 py-1 rounded-full text-[11px] font-bold">REJECTED</span>;
      default: return <span className="bg-[#F1F5F9] text-[#64748B] px-3 py-1 rounded-full text-[11px] font-bold">DRAFT</span>;
    }
  };

  const AiBadge = ({ flag, severity }) => {
    if (!flag) return null;
    const isHigh = severity === 'HIGH';
    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider w-max ${isHigh ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#FEF3C7] text-[#D97706]'}`}>
        <AlertTriangle className="w-3 h-3" />
        {isHigh ? 'HIGH RISK' : 'FLAGGED'}
      </div>
    );
  };

  return (
    <div className="relative min-h-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-brand-dark tracking-tight mb-1">Approvals Queue</h1>
          <p className="text-[#64748B] text-[15px]">Review and manage team reimbursement requests.</p>
        </div>
        {/* Batch Approve removed - feature not yet implemented */}
      </div>

      {/* Pending Table Area */}
      <div className="bg-white rounded-[20px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] mb-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[19px] font-bold text-brand-dark tracking-tight">Pending Requests ({pendingExpenses.length})</h2>
          {/* Filter and Sort removed - features not yet implemented */}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                <th className="pb-4 text-[11px] font-bold text-brand-label uppercase tracking-wider">Employee</th>
                <th className="pb-4 text-[11px] font-bold text-brand-label uppercase tracking-wider">Description</th>
                <th className="pb-4 text-[11px] font-bold text-brand-label uppercase tracking-wider">Date</th>
                <th className="pb-4 text-[11px] font-bold text-brand-label uppercase tracking-wider">Category</th>
                <th className="pb-4 text-[11px] font-bold text-brand-label uppercase tracking-wider">Policy Risk</th>
                <th className="pb-4 text-[11px] font-bold text-brand-label uppercase tracking-wider">Amount</th>
                <th className="pb-4 text-[11px] font-bold text-brand-label uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="py-8 text-center text-[#8695AD]">Loading queue...</td></tr>
              ) : pendingExpenses.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-[#8695AD]">All caught up! No approvals needed.</td></tr>
              ) : (
                pendingExpenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors group">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[12px]">
                           {exp.submittedBy?.name?.[0] || 'U'}
                         </div>
                         <span className="text-[14px] font-semibold text-brand-dark">{exp.submittedBy?.name || 'Unknown User'}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <Link to={`/expenses/${exp.id}`} className="text-[14px] text-brand-dark font-medium max-w-[180px] truncate hover:text-brand-primary block">{exp.description}</Link>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="text-[14px] text-[#64748B] whitespace-pre-wrap">{new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).replace(',', ',\n')}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <CategoryBadge category={exp.category} />
                    </td>
                    <td className="py-4 pr-4">
                      {exp.aiFlag ? <AiBadge flag={exp.aiFlag} severity={exp.aiSeverity} /> : <span className="text-[13px] text-[#059669] font-medium flex items-center gap-1"><Check className="w-3 h-3"/> Clean</span>}
                    </td>
                    <td className="py-4 pr-4 text-[14px] font-bold text-brand-dark whitespace-nowrap">
                      {formatCurrency(exp.convertedAmount || exp.amount, exp.companyCurrency || exp.currency)}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <button onClick={() => setActionModal({ isOpen: true, type: 'reject', expense: exp })} className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#FEE2E2] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors" title="Reject">
                           <X className="w-4 h-4" />
                         </button>
                         <button onClick={() => setActionModal({ isOpen: true, type: 'approve', expense: exp })} className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#D1FAE5] text-[#059669] hover:bg-[#A7F3D0] transition-colors" title="Approve">
                           <Check className="w-4 h-4" />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit History Area */}
      {completedExpenses.length > 0 && (
        <div className="bg-white rounded-[20px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
          <h2 className="text-[19px] font-bold text-brand-dark tracking-tight mb-8">Approval History</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F1F5F9]">
                  <th className="pb-4 text-[11px] font-bold text-brand-label uppercase tracking-wider">Employee</th>
                  <th className="pb-4 text-[11px] font-bold text-brand-label uppercase tracking-wider">Description</th>
                  <th className="pb-4 text-[11px] font-bold text-brand-label uppercase tracking-wider">Date Resolved</th>
                  <th className="pb-4 text-[11px] font-bold text-brand-label uppercase tracking-wider">Amount</th>
                  <th className="pb-4 text-[11px] font-bold text-brand-label uppercase tracking-wider text-right">Final Status</th>
                </tr>
              </thead>
              <tbody>
                  {completedExpenses.slice(0, 10).map((exp) => (
                    <tr key={exp.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors group">
                      <td className="py-4 pr-4">
                        <span className="text-[14px] font-semibold text-brand-dark">{exp.submittedBy?.name || 'Unknown User'}</span>
                      </td>
                      <td className="py-4 pr-4">
                        <Link to={`/expenses/${exp.id}`} className="text-[14px] text-brand-dark font-medium max-w-[180px] truncate hover:text-brand-primary block">{exp.description}</Link>
                      </td>
                      <td className="py-4 pr-4">
                        <p className="text-[14px] text-[#64748B]">{new Date(exp.updatedAt || exp.date).toLocaleDateString()}</p>
                      </td>
                      <td className="py-4 pr-4 text-[14px] font-bold text-brand-dark whitespace-nowrap">
                        {formatCurrency(exp.convertedAmount || exp.amount, exp.companyCurrency || exp.currency)}
                      </td>
                      <td className="py-4 text-right">
                        <StatusBadge status={exp.status} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Modal */}
      <Modal isOpen={actionModal.isOpen} onClose={() => { setActionModal({ isOpen: false, type: null, expense: null }); setComment(''); }} title={actionModal.type === 'approve' ? 'Approve Expense' : 'Reject Expense'} maxWidth="max-w-md">
        <form onSubmit={handleAction} className="space-y-5 p-2">
          {actionModal.expense && (
            <div className="bg-brand-bg rounded-xl p-5 border border-transparent flex justify-between items-center shadow-inner mt-2">
              <div>
                <p className="text-[13px] text-brand-label font-bold uppercase tracking-wider mb-1">Total Amount</p>
                <p className="text-[20px] font-bold text-brand-dark">
                  {formatCurrency(actionModal.expense.convertedAmount || actionModal.expense.amount, actionModal.expense.companyCurrency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[13px] text-brand-label font-bold uppercase tracking-wider mb-1">Employee</p>
                <p className="text-[15px] font-bold text-brand-dark">{actionModal.expense.submittedBy?.name}</p>
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <label className="block text-[11px] font-bold text-brand-label uppercase tracking-wider mb-2">
              Comment {actionModal.type === 'reject' && <span className="text-[#DC2626]">*</span>}
            </label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} required={actionModal.type === 'reject'}
              className="w-full px-4 py-3.5 bg-brand-input rounded-xl text-[14px] text-brand-dark focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all border border-transparent focus:border-brand-primary resize-none"
              rows={3} placeholder={actionModal.type === 'reject' ? 'Reason for rejection...' : 'Optional comment...'} />
          </div>

          <div className="flex gap-4 pt-4 justify-end">
            <button type="button" onClick={() => { setActionModal({ isOpen: false, type: null, expense: null }); setComment(''); }} className="px-6 py-3 border border-[#E2E8F0] rounded-xl text-[14px] font-bold text-[#64748B] hover:bg-[#F8FAFC] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={processing} className={`${actionModal.type === 'approve' ? 'bg-[#059669] hover:bg-[#047857]' : 'bg-[#DC2626] hover:bg-[#B91C1C]'} text-white px-8 py-3 rounded-xl text-[14px] font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}>
              {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : actionModal.type === 'approve' ? 'Approve Now' : 'Reject Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
