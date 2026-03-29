export const CATEGORIES = [
  { value: 'TRAVEL', label: 'Travel', icon: '✈️' },
  { value: 'MEALS', label: 'Meals', icon: '🍽️' },
  { value: 'ACCOMMODATION', label: 'Accommodation', icon: '🏨' },
  { value: 'OFFICE', label: 'Office', icon: '🏢' },
  { value: 'ENTERTAINMENT', label: 'Entertainment', icon: '🎭' },
  { value: 'OTHER', label: 'Other', icon: '📦' },
];

export const STATUS_COLORS = {
  PENDING: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  IN_REVIEW: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  REJECTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export const AI_SEVERITY_COLORS = {
  LOW: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  MEDIUM: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  HIGH: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

export const AUDIT_ACTION_COLORS = {
  SUBMITTED: 'bg-blue-500',
  AI_FLAGGED: 'bg-amber-500',
  STEP_ASSIGNED: 'bg-gray-400',
  APPROVED: 'bg-emerald-500',
  REJECTED: 'bg-red-500',
  COMMENTED: 'bg-gray-400',
  OVERRIDDEN: 'bg-purple-500',
  STATUS_CHANGED: 'bg-indigo-500',
  OCR_PROCESSED: 'bg-cyan-500',
};
