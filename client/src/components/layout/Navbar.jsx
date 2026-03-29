import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getInitials } from '../../utils/formatters.js';
import { LogOut, Menu, X } from 'lucide-react';
import NotificationBell from '../notifications/NotificationBell.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/admin', match: '/admin', label: 'Dashboard' },
    { to: '/expenses', match: '/expenses', label: 'Expenses' },
  ];

  if (user?.role === 'MANAGER' || user?.role === 'ADMIN') {
    navLinks.push({ to: '/manager', match: '/manager', label: 'Approvals' });
  }

  return (
    <nav className="h-[64px] bg-white border-b border-[#F1F5F9] fixed top-0 w-full z-40 flex items-center justify-between px-6">
      <div className="flex items-center gap-10 h-full">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 h-full">
          <span className="font-bold text-brand-dark text-xl tracking-tight hidden sm:block">ReimburseIQ</span>
        </Link>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-5">
           <NotificationBell />
           <div className="w-px h-6 bg-[#E2E8F0]"></div>

           {/* User Dropdown */}
           <div className="relative">
             <button
               onClick={() => setShowDropdown(!showDropdown)}
               className="w-9 h-9 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold ml-1 transition-transform hover:scale-105"
             >
               {getInitials(user?.name) || 'US'}
             </button>

             {showDropdown && (
               <>
                 <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                 <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-20 py-2">
                   <div className="px-4 py-3 border-b border-gray-50">
                     <p className="text-[14px] font-bold text-brand-dark">{user?.name}</p>
                     <p className="text-[12px] text-[#64748B] mt-0.5">{user?.email}</p>
                     <span className="mt-2 inline-block px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] text-[10px] font-bold rounded uppercase tracking-wider">
                       {user?.role}
                     </span>
                   </div>
                   <button
                     onClick={handleLogout}
                     className="w-full px-4 py-2.5 text-[14px] font-medium text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                   >
                     <LogOut className="w-4 h-4" /> Sign out
                   </button>
                 </div>
               </>
             )}
           </div>
        </div>

        {/* Mobile menu trigger */}
        <button
          className="md:hidden p-2 text-[#A0ABBD]"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {showMobileMenu && (
        <div className="absolute top-[64px] left-0 w-full bg-white border-b border-gray-100 py-4 px-6 md:hidden shadow-lg flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link 
              key={link.label} 
              to={link.to} 
              className="text-[15px] font-bold text-brand-dark" 
              onClick={() => setShowMobileMenu(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
