import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import { resolveBrandName } from '../lib/branding';
import type { UserNotificationItem } from '../types';

interface HeaderProps {
  profileRoute?: string;
  brandName?: string;
}

const Header: React.FC<HeaderProps> = ({ profileRoute = '/dashboard/profile', brandName }) => {
  const navigate = useNavigate();
  const resolvedBrandName = resolveBrandName(brandName);
  const {
    notifications,
    unreadNotificationCount,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useMarket();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void refreshNotifications({ limit: 20 });
  }, [refreshNotifications]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isNotificationOpen]);

  const notificationBadge = useMemo(() => {
    if (unreadNotificationCount <= 0) {
      return null;
    }

    return unreadNotificationCount > 9 ? '9+' : String(unreadNotificationCount);
  }, [unreadNotificationCount]);

  const toggleNotifications = () => {
    const nextOpen = !isNotificationOpen;
    setIsNotificationOpen(nextOpen);

    if (nextOpen) {
      void refreshNotifications({ limit: 20 });
    }
  };

  const handleNotificationClick = async (notification: UserNotificationItem) => {
    try {
      if (!notification.readAt) {
        await markNotificationAsRead(notification.id);
      }

      if (notification.actionUrl) {
        navigate(notification.actionUrl);
        setIsNotificationOpen(false);
      }
    } catch {
      // Keep the panel open so users can retry if an action fails.
    }
  };

  return (
    <header className="flex items-center justify-between p-4 sticky top-0 bg-[#050505]/80 backdrop-blur-md z-50 border-b border-white/5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-yellow-400 flex items-center justify-center overflow-hidden shadow-lg shadow-green-500/20">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-black" fill="currentColor">
            <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.09-4-4L2 15.6l1.5 2.89z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white leading-none">{resolvedBrandName}</h1>
        </div>
      </div>

      <div ref={containerRef} className="flex items-center gap-3 text-zinc-400 relative">
        <button
          type="button"
          onClick={toggleNotifications}
          className="p-2 hover:bg-zinc-800 rounded-full transition-colors relative"
          aria-label="Open notifications"
        >
          <Bell size={20} />
          {notificationBadge && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] text-white font-bold leading-4 text-center">
              {notificationBadge}
            </span>
          )}
        </button>
        <button
          type="button"
          className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          onClick={() => navigate(profileRoute)}
          aria-label="Open profile settings"
        >
          <Settings size={20} />
        </button>

        {isNotificationOpen && (
          <div className="absolute right-0 top-12 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl shadow-black/60 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Notifications</h3>
              <button
                type="button"
                className="text-[11px] text-emerald-400 hover:text-emerald-300 disabled:text-zinc-600 disabled:cursor-not-allowed inline-flex items-center gap-1"
                onClick={() => void markAllNotificationsAsRead()}
                disabled={unreadNotificationCount <= 0}
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 && (
                <div className="px-4 py-6 text-sm text-zinc-500">No notifications yet.</div>
              )}

              {notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  onClick={() => void handleNotificationClick(notification)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${notification.readAt ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{notification.title}</p>
                      <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{notification.message}</p>
                      <p className="mt-1 text-[11px] text-zinc-500">{formatTimestamp(notification.createdAt)}</p>
                    </div>
                    {!notification.readAt && <span className="mt-1 w-2 h-2 rounded-full bg-emerald-400" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

function formatTimestamp(input?: string | null): string {
  if (!input) {
    return 'Just now';
  }

  const timestamp = new Date(input);

  if (Number.isNaN(timestamp.getTime())) {
    return 'Just now';
  }

  return timestamp.toLocaleString();
}

export default Header;
