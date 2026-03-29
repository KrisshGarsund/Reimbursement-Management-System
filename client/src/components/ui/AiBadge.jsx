import { AI_SEVERITY_COLORS } from '../../utils/constants.js';

export default function AiBadge({ severity, reasoning }) {
  if (!severity) return null;

  const colors = AI_SEVERITY_COLORS[severity] || AI_SEVERITY_COLORS.LOW;

  return (
    <div className="relative group inline-flex">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border cursor-help ${colors.bg} ${colors.text} ${colors.border}`}
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        AI: {severity === 'HIGH' ? 'High Risk' : severity === 'MEDIUM' ? 'Medium Risk' : 'Low Risk'}
      </span>

      {reasoning && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 max-w-xs shadow-lg">
            {reasoning}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
              <div className="w-2 h-2 bg-gray-900 rotate-45" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
