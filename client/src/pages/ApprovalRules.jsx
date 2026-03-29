import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/axios.js';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { TableSkeleton } from '../components/ui/Skeleton.jsx';
import { Plus, Trash2, Settings } from 'lucide-react';

export default function ApprovalRules() {
  const toast = useToast();
  const [rules, setRules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ stepOrder: 1, approverId: '', ruleType: 'SEQUENTIAL', percentageThreshold: '', specificApproverId: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/rules').then((r) => setRules(r.data.data)),
      api.get('/users').then((r) => setUsers(r.data.data)),
    ]).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        stepOrder: parseInt(form.stepOrder),
        approverId: form.approverId,
        ruleType: form.ruleType,
        percentageThreshold: form.percentageThreshold ? parseFloat(form.percentageThreshold) : null,
        specificApproverId: form.specificApproverId || null,
      };
      await api.post('/rules', payload);
      toast.success('Rule added!');
      setShowModal(false);
      setForm({ stepOrder: 1, approverId: '', ruleType: 'SEQUENTIAL', percentageThreshold: '', specificApproverId: '' });
      const { data } = await api.get('/rules');
      setRules(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  }

  async function handleDelete(ruleId) {
    try {
      await api.delete(`/rules/${ruleId}`);
      toast.success('Rule deleted');
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch { toast.error('Delete failed'); }
  }

  const managers = users.filter((u) => u.role === 'MANAGER' || u.role === 'ADMIN');
  const ruleTypeLabels = { SEQUENTIAL: 'Sequential', PERCENTAGE: 'Percentage', SPECIFIC_APPROVER: 'Specific Approver', HYBRID: 'Hybrid' };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Rules</h1>
          <p className="text-gray-500 text-sm mt-1">Configure the multi-step approval workflow</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={4} /></div>
        ) : rules.length === 0 ? (
          <EmptyState title="No approval rules" description="Add rules to define your approval workflow." icon={Settings} />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Step</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Approver</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Rule Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Threshold</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="w-8 h-8 inline-flex items-center justify-center bg-indigo-50 text-indigo-700 rounded-lg font-bold text-sm">
                      {rule.stepOrder}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{rule.approver?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                      {ruleTypeLabels[rule.ruleType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                    {rule.percentageThreshold ? `${rule.percentageThreshold}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(rule.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Approval Rule">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Step Order</label>
            <input type="number" min="1" value={form.stepOrder} onChange={(e) => setForm({ ...form, stepOrder: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Approver</label>
            <select value={form.approverId} onChange={(e) => setForm({ ...form, approverId: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white" required>
              <option value="">Select approver</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
            <select value={form.ruleType} onChange={(e) => setForm({ ...form, ruleType: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
              <option value="SEQUENTIAL">Sequential</option>
              <option value="PERCENTAGE">Percentage</option>
              <option value="SPECIFIC_APPROVER">Specific Approver</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>
          {(form.ruleType === 'PERCENTAGE' || form.ruleType === 'HYBRID') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Percentage Threshold (%)</label>
              <input type="number" min="1" max="100" value={form.percentageThreshold} onChange={(e) => setForm({ ...form, percentageThreshold: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
            </div>
          )}
          {(form.ruleType === 'SPECIFIC_APPROVER' || form.ruleType === 'HYBRID') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specific Approver</label>
              <select value={form.specificApproverId} onChange={(e) => setForm({ ...form, specificApproverId: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
                <option value="">Select</option>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Add Rule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
