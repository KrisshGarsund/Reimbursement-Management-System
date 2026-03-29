import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import api from '../../api/axios.js';
import { formatRelativeTime } from '../../utils/formatters.js';

export default function NotificationBell() {
  const { notifications, unreadCount, updateNotifications, decrementUnread } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const { data } = await api.get('/notifications');
        updateNotifications(data.data.notifications, data.data.unreadCount);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    }
    fetchNotifications();
  }, [updateNotifications]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (notification) => {
    if (!notification.isRead) {
      try {
        await api.patch(`/notifications/${notification.id}/read`);
        decrementUnread();
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    if (notification.expenseId) {
      navigate(`/expenses/${notification.expenseId}`);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.slice(0, 15).map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleMarkRead(notif)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    !notif.isRead ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <p className="text-sm text-gray-800 line-clamp-2">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(notif.createdAt)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
