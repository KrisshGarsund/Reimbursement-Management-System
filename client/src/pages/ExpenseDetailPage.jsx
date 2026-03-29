import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/axios.js';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import AiBadge from '../components/ui/AiBadge.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import { formatCurrency, formatDate, formatRelativeTime, getCategoryIcon, getInitials } from '../utils/formatters.js';
import { AUDIT_ACTION_COLORS } from '../utils/constants.js';
import { ArrowLeft, Clock, FileText, Image } from 'lucide-react';

export default function ExpenseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [expense, setExpense] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    async function fetchData() {
      try {
        const [expRes, histRes] = await Promise.all([
          api.get(`/expenses/${id}`),
          api.get(`/expenses/${id}/history`),
        ]);
        setExpense(expRes.data.data);
        setHistory(histRes.data.data);
      } catch { toast.error('Failed to load expense'); }
      finally { setLoading(false); }
    }
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  if (!expense) return <div className="text-center py-16 text-gray-500">Expense not found</div>;

  return (
    <div>
      <Link to={-1} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl">
              {getCategoryIcon(expense.category)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {formatCurrency(expense.convertedAmount || expense.amount, expense.companyCurrency || expense.currency)}
              </h1>
              {expense.currency !== expense.companyCurrency && (
                <p className="text-sm text-gray-400">Original: {formatCurrency(expense.amount, expense.currency)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {expense.aiFlag && <AiBadge severity={expense.aiSeverity} reasoning={expense.aiReasoning} />}
            <StatusBadge status={expense.status} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoCard label="Category" value={`${getCategoryIcon(expense.category)} ${expense.category}`} />
          <InfoCard label="Date" value={formatDate(expense.date)} />
          <InfoCard label="Submitted by" value={expense.submittedBy?.name || '—'} />
          <InfoCard label="Current Step" value={`Step ${expense.currentApproverStep}`} />
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
          <p className="text-sm text-gray-700">{expense.description}</p>
        </div>

        {expense.receiptUrl && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-2">Receipt</p>
            <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-indigo-600 hover:bg-gray-100 transition-colors">
              <Image className="w-4 h-4" /> View Receipt
            </a>
          </div>
        )}

        {/* AI Analysis */}
        {expense.aiFlag && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-2">AI Analysis</p>
            <div className={`rounded-xl px-4 py-3 ${
              expense.aiSeverity === 'HIGH' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'
            }`}>
              <p className="text-sm text-gray-800">{expense.aiReasoning}</p>
              {expense.aiFlags && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(Array.isArray(expense.aiFlags) ? expense.aiFlags : []).map((flag) => (
                    <span key={flag} className="px-2 py-0.5 bg-white/80 rounded-full text-xs font-medium text-gray-600 border border-gray-200">
                      {flag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button onClick={() => setActiveTab('details')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'details' ? 'text-indigo-700 border-b-2 border-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
            <div className="flex items-center gap-2"><FileText className="w-4 h-4" /> Approval Log</div>
          </button>
          <button onClick={() => setActiveTab('history')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'history' ? 'text-indigo-700 border-b-2 border-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> History</div>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'details' ? (
            <ApprovalLog logs={expense.approvalLogs || []} />
          ) : (
            <AuditTimeline history={history} />
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3">
      <p className="text-xs font-medium text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function ApprovalLog({ logs }) {
  if (logs.length === 0) return <p className="text-sm text-gray-400 text-center py-6">No approval actions yet</p>;

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-medium text-gray-600 border border-gray-200 flex-shrink-0">
            {getInitials(log.approver?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-900">{log.approver?.name}</span>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                log.action === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : log.action === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
              }`}>{log.action}</span>
              <span className="text-xs text-gray-400">Step {log.stepOrder}</span>
            </div>
            {log.comment && <p className="text-sm text-gray-500 mt-1">{log.comment}</p>}
            <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(log.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditTimeline({ history }) {
  if (history.length === 0) return <p className="text-sm text-gray-400 text-center py-6">No history yet</p>;

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
      <div className="space-y-6">
        {history.map((entry, idx) => (
          <div key={entry.id} className="relative flex gap-4 ml-0">
            {/* Timeline dot */}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${
              AUDIT_ACTION_COLORS[entry.action] || 'bg-gray-400'
            }`}>
              {getInitials(entry.actor?.name)}
            </div>

            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-900">{entry.actor?.name}</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded font-medium">{entry.actor?.role}</span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${
                  AUDIT_ACTION_COLORS[entry.action] || 'bg-gray-400'
                }`}>
                  {entry.action.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-400">{formatRelativeTime(entry.createdAt)}</span>
              </div>

              {entry.comment && (
                <p className="text-sm text-gray-600 mt-1.5 bg-gray-50 rounded-lg px-3 py-2">{entry.comment}</p>
              )}

              {/* AI flagged details */}
              {entry.action === 'AI_FLAGGED' && entry.metadata && (
                <div className="mt-2 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                  <p className="text-sm text-amber-800">{entry.comment}</p>
                  {entry.metadata.flags && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {entry.metadata.flags.map((flag) => (
                        <span key={flag} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          {flag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
