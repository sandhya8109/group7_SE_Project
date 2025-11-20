import React, { useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'

export default function NotificationBell(){
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-full hover:bg-panel2 transition"
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-panel border border-slate-700/60 rounded-2xl shadow-glow z-20">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/60">
            <div className="font-semibold">Notifications</div>
            <button className="text-xs text-accent" onClick={markAllRead}>Mark all read</button>
          </div>
          <div className="max-h-80 overflow-auto divide-y divide-slate-800/60">
            {notifications.length === 0 && (
              <div className="p-4 text-sm text-muted">You are all caught up!</div>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-panel2 ${n.read ? 'text-muted' : ''}`}
                onClick={() => { markRead(n.id) }}
              >
                <div className="font-medium capitalize">{n.type.replace('-', ' ')}</div>
                <div className="text-xs text-muted">{new Date(n.date).toLocaleString()}</div>
                <div>{n.message}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
