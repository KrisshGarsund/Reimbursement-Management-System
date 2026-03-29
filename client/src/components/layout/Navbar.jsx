import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import NotificationBell from '../notifications/NotificationBell.jsx';
import { getInitials } from '../../utils/formatters.js';
import { LayoutDashboard, Users, FileText, Settings, ChevronDown, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [];
  if (user?.role === 'ADMIN') {
    navLinks.push(
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/rules', label: 'Rules', icon: Settings },
    );
  }
  if (user?.role === 'MANAGER') {
    navLinks.push(
      { to: '/manager', label: 'Approvals', icon: LayoutDashboard },
    );
  }
  navLinks.push({ to: '/expenses', label: 'Expenses', icon: FileText });

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="font-semibold text-gray-900 text-lg hidden sm:block">ReimburseIQ</span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} icon={link.icon} label={link.label} />
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <NotificationBell />

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-medium">
                  {getInitials(user?.name)}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg z-20 py-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="mt-1 inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md">
                        {user?.role}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu trigger */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-50"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-100 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} icon={link.icon} label={link.label} onClick={() => setShowMobileMenu(false)} />
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ to, icon: Icon, label, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}
