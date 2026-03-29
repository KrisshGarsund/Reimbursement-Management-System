import { STATUS_COLORS } from '../../utils/constants.js';

export default function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
  const labels = {
    PENDING: 'Pending',
    IN_REVIEW: 'In Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
      {labels[status] || status}
    </span>
  );
}
