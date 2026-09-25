import React, { useEffect, useState } from 'react';
import { X, Bell, Check, UserPlus, Heart, MessageSquare, Briefcase, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../types';
import { dbService } from '../services/dbService';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (link: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user || !isOpen) return;

    const unsubscribe = dbService.subscribeNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleItemClick = async (notif: Notification) => {
    if (!notif.read) {
      await dbService.markNotificationRead(notif.id);
    }
    if (notif.link && onNavigate) {
      onNavigate(notif.link);
      onClose();
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case 'like':
        return <Heart className="w-4 h-4 text-rose-500 fill-current" />;
      case 'comment':
      case 'message':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case 'booking':
      case 'job_application':
      case 'request_quote':
        return <Briefcase className="w-4 h-4 text-amber-600" />;
      case 'verification':
        return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
              <Bell className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No notifications yet</p>
              <p className="text-xs text-slate-400 mt-1">
                You'll receive real-time updates when someone follows you, likes your post, messages you, or responds to your listings.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`p-3.5 hover:bg-slate-50 cursor-pointer flex items-start gap-3 transition-colors ${
                  !n.read ? 'bg-blue-50/40' : ''
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {new Date(n.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
