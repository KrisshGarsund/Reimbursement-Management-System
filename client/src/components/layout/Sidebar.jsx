import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { LayoutDashboard, FileText, CheckSquare, LogOut, Plus, HelpCircle } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const dashboardLink = user?.role === 'ADMIN'
    ? '/admin'
    : user?.role === 'MANAGER'
    ? '/manager'
    : '/expenses';

  const dashboardMatch = user?.role === 'ADMIN'
    ? '/admin'
    : user?.role === 'MANAGER'
    ? '/manager'
    : '/expenses';

  const navLinks = [
    { to: dashboardLink, match: dashboardMatch, label: 'Dashboard', icon: LayoutDashboard },
    { to: '/expenses', match: '/expenses', label: 'Expenses', icon: FileText },
  ];

  if (user?.role === 'MANAGER' || user?.role === 'ADMIN') {
    navLinks.push({ to: '/manager', match: '/manager', label: 'Approvals', icon: CheckSquare });
  }

  // TODO: Implement Analytics and Settings pages
  // navLinks.push(
  //   { to: '/analytics', match: '/analytics', label: 'Analytics', icon: BarChart2 },
  //   { to: '/settings', match: '/settings', label: 'Settings', icon: Settings }
  // );

  return (
    <aside className="w-[260px] h-[calc(100vh-64px)] fixed left-0 top-[64px] bg-white border-r border-[#F1F5F9] flex flex-col pt-6 z-30 hidden md:flex">
      {/* Enterprise Header */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#55559F] rounded-lg flex items-center justify-center shadow-md">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M3 21H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             <path d="M5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             <path d="M9 7H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             <path d="M9 11H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             <path d="M9 15H11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h2 className="text-[#1E254C] font-bold text-[15px] leading-tight font-sans tracking-tight">ReimburseIQ<br/>Finance</h2>
          <p className="text-[10px] text-[#8695AD] font-bold tracking-wider uppercase mt-0.5">Manager</p>
        </div>
      </div>

      {/* Main Nav Links */}
      <nav className="flex-1 px-4 space-y-1">
        {navLinks.map((link) => {
          const isActive = location.pathname.startsWith(link.match);
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              to={link.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-[14px] font-medium ${
                isActive
                  ? 'bg-brand-bg text-brand-primary'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E254C]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-brand-primary' : 'text-[#8695AD]'}`} />
              <span className={isActive ? 'font-bold' : ''}>{link.label}</span>
              {isActive && (
                <div className="absolute left-0 w-1 h-8 bg-brand-primary rounded-r-md"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-4 pb-6 space-y-2 mt-auto">
        <Link to="/expenses?new=true" className="w-full bg-brand-primary text-white py-3 rounded-xl font-semibold hover:bg-brand-primary-hover transition-all flex items-center justify-center gap-2 text-[14px]">
          <Plus className="w-[18px] h-[18px]" /> New Expense
        </Link>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-[14px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E254C]">
          <HelpCircle className="w-5 h-5 text-[#8695AD]" />
          Help Center
        </button>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-[14px] font-medium text-red-500 hover:bg-red-50">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
