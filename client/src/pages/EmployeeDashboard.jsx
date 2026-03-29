import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/axios.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { Plus, ScanLine } from 'lucide-react';
import Modal from '../components/ui/Modal.jsx';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
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

  // Open modal automatically if ?new=true is in the URL
  useEffect(() => {
    if (new URLSearchParams(location.search).get('new') === 'true') {
      setShowForm(true);
      navigate('/expenses', { replace: true });
    }
  }, [location.search]);

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
          category: data.data.category?.toUpperCase() || prev.category,
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

  const pendingAmount = expenses.filter(e => e.status === 'PENDING').reduce((acc, curr) => acc + (curr.convertedAmount || curr.amount), 0);
  const pendingCount = expenses.filter(e => e.status === 'PENDING').length;

  const approvedAmount = expenses.filter(e => e.status === 'APPROVED').reduce((acc, curr) => acc + (curr.convertedAmount || curr.amount), 0);
  const approvedCount = expenses.filter(e => e.status === 'APPROVED').length;

  const draftAmount = expenses.filter(e => e.status === 'DRAFT').reduce((acc, curr) => acc + (curr.convertedAmount || curr.amount), 0);
  const draftCount = expenses.filter(e => e.status === 'DRAFT').length;

  const StatusBadge = ({ status }) => {
    switch(status) {
      case 'APPROVED': return <span className="bg-[#D1FAE5] text-[#059669] px-3 py-1 rounded-full text-[11px] font-bold">APPROVED</span>;
      case 'PENDING': return <span className="bg-[#E0E7FF] text-[#4F46E5] px-3 py-1 rounded-full text-[11px] font-bold">SUBMITTED</span>;
      case 'REJECTED': return <span className="bg-[#FEE2E2] text-[#DC2626] px-3 py-1 rounded-full text-[11px] font-bold">REJECTED</span>;
      default: return <span className="bg-[#F1F5F9] text-[#64748B] px-3 py-1 rounded-full text-[11px] font-bold">DRAFT</span>;
    }
  };

  const CategoryBadge = ({ category }) => {
    return <span className="bg-brand-bg text-[#4F54A4] px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">{category || 'GENERAL'}</span>;
  };

  return (
    <div className="relative min-h-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-brand-dark tracking-tight mb-1">Financial Overview</h1>
          <p className="text-[#64748B] text-[15px]">Manage your corporate spending and reimbursements.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowForm(true)} className="bg-brand-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-primary-hover transition-colors shadow-[0_4px_12px_rgba(79,84,164,0.2)] text-[14px] flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Expense
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#F4F6FB] rounded-[20px] p-6 relative overflow-hidden">
          <h3 className="text-[#64748B] text-[11px] font-bold tracking-wider uppercase mb-2 relative z-10">To Submit</h3>
          <p className="text-[32px] font-bold text-[#1E254C] tracking-tight relative z-10">{formatCurrency(draftAmount, user?.companyCurrency || 'USD')}</p>
          <div className="flex items-center gap-2 mt-4 relative z-10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span className="text-[13px] text-[#64748B] font-medium">{draftCount} pending receipts</span>
          </div>
          {/* Decorative Icon */}
          <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.05]">
             <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 1-2.4 1.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"></path></svg>
          </div>
        </div>

        <div className="bg-[#E6EAF6] rounded-[20px] p-6 relative overflow-hidden">
          <h3 className="text-[#4F54A4] text-[11px] font-bold tracking-wider uppercase mb-2 relative z-10">Waiting Approval</h3>
          <p className="text-[32px] font-bold text-[#1E254C] tracking-tight relative z-10">{formatCurrency(pendingAmount, user?.companyCurrency || 'USD')}</p>
          <div className="flex items-center gap-2 mt-4 relative z-10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F54A4" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span className="text-[13px] text-[#4F54A4] font-medium">{pendingCount} active workflows</span>
          </div>
          <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.05] text-[#4F54A4]">
             <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"></circle><polyline stroke="#fff" strokeWidth="2" points="12 6 12 12 16 14"></polyline></svg>
          </div>
        </div>

        <div className="bg-[#E1F7EC] rounded-[20px] p-6 relative overflow-hidden">
          <h3 className="text-[#037A5B] text-[11px] font-bold tracking-wider uppercase mb-2 relative z-10">Approved</h3>
          <p className="text-[32px] font-bold text-[#1E254C] tracking-tight relative z-10">{formatCurrency(approvedAmount, user?.companyCurrency || 'USD')}</p>
          <div className="flex items-center gap-2 mt-4 relative z-10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#037A5B" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span className="text-[13px] text-[#037A5B] font-medium">{approvedCount} approved claims</span>
          </div>
          <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.05] text-[#037A5B]">
             <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path></svg>
          </div>
        </div>
      </div>

      {/* Transactions Table Area */}
      <div className="bg-white rounded-[20px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[19px] font-bold text-brand-dark tracking-tight">Recent Transactions</h2>
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
                <th className="pb-4 text-[11px] font-bold text-brand-label uppercase tracking-wider">Paid By</th>
                <th className="pb-4 text-[11px] font-bold text-brand-label uppercase tracking-wider">Amount</th>
                <th className="pb-4 text-[11px] font-bold text-brand-label uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="py-8 text-center text-[#8695AD]">Loading transactions...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-[#8695AD]">No transactions found.</td></tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors group">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-[12px]">
                           {exp.submittedBy?.name?.[0] || user?.name?.[0] || 'U'}
                         </div>
                         <span className="text-[14px] font-semibold text-brand-dark">{exp.submittedBy?.name || user?.name || 'Unknown User'}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="text-[14px] text-brand-dark font-medium max-w-[180px] truncate">{exp.description}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="text-[14px] text-[#64748B] whitespace-pre-wrap">{new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).replace(',', ',\n')}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <CategoryBadge category={exp.category} />
                    </td>
                    <td className="py-4 pr-4 text-[14px] text-[#64748B]">Personal</td>
                    <td className="py-4 pr-4 text-[14px] font-bold text-brand-dark whitespace-nowrap">
                      {formatCurrency(exp.convertedAmount || exp.amount, exp.companyCurrency || exp.currency)}
                    </td>
                    <td className="py-4">
                      <StatusBadge status={exp.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 flex items-center justify-between text-[#8695AD] text-[13px]">
           <span>Showing 1-{Math.min(expenses.length, 10)} of {expenses.length} expenses</span>
           <div className="flex items-center gap-1">
             <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors">&lt;</button>
             <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-primary text-white font-bold">1</button>
             <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors">2</button>
             <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors">3</button>
             <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors">&gt;</button>
           </div>
        </div>
      </div>

      {/* New Expense Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Entry" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5 p-2">
          <div className="bg-brand-bg rounded-xl p-6 border border-transparent shadow-inner">
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm text-brand-primary">
                <ScanLine className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-brand-dark mb-0.5">Quick Scan</p>
                <p className="text-[13px] text-brand-label">Upload a receipt image to auto-fill the details instantly.</p>
              </div>
              <input type="file" className="hidden" accept="image/*"
                onChange={(e) => { if (e.target.files[0]) { setForm({ ...form, receipt: e.target.files[0] }); handleOCR(e.target.files[0]); } }} />
              {ocrLoading && <div className="w-6 h-6 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin ml-auto" />}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-5 mt-4">
             <div>
               <label className="block text-[11px] font-bold text-brand-label uppercase tracking-wider mb-2">Description</label>
               <input type="text" value={form.description} required
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3.5 bg-brand-input rounded-xl text-[14px] text-brand-dark focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all border border-transparent focus:border-brand-primary"
                  placeholder="e.g. Client Dinner - Q3 Strategy" />
             </div>
             <div>
               <label className="block text-[11px] font-bold text-brand-label uppercase tracking-wider mb-2">Category</label>
               <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3.5 bg-brand-input rounded-xl text-[14px] text-brand-dark focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all border border-transparent focus:border-brand-primary appearance-none">
                  <option value="GENERAL">General</option>
                  <option value="TRAVEL">Travel</option>
                  <option value="MEALS">Meals</option>
                  <option value="TECHNOLOGY">Technology</option>
                  <option value="OFFICE">Office</option>
               </select>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
             <div>
               <label className="block text-[11px] font-bold text-brand-label uppercase tracking-wider mb-2">Total Amount ({form.currency})</label>
               <input type="number" step="0.01" value={form.amount} required
                  onChange={(e) => { setForm({ ...form, amount: e.target.value }); handleConvert(e.target.value, form.currency); }}
                  className="w-full px-4 py-3.5 bg-brand-input rounded-xl text-[14px] font-bold text-brand-dark focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all border border-transparent focus:border-brand-primary"
                  placeholder="0.00" />
             </div>
             <div>
               <label className="block text-[11px] font-bold text-brand-label uppercase tracking-wider mb-2">Expense Date</label>
               <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-3.5 bg-brand-input rounded-xl text-[14px] text-brand-dark focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all border border-transparent focus:border-brand-primary" required />
             </div>
          </div>

          <div className="flex gap-4 pt-6 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 border border-[#E2E8F0] rounded-xl text-[14px] font-bold text-[#64748B] hover:bg-[#F8FAFC] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="bg-brand-primary text-white px-8 py-3 rounded-xl text-[14px] font-bold hover:bg-brand-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
