import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

// Events the admin UI cares about
export const NOTIFICATION_EVENTS = [
  'notification:new-order',
  'notification:new-return',
  'notification:new-message',
  'notification:new-user',
]

export const TYPE_ICON = {
  ORDER:   '🛒',
  RETURN:  '↩️',
  MESSAGE: '✉️',
  USER:    '👤',
  SYSTEM:  '⚙️',
}

export function getNotificationLink(n) {
  if (!n) return '/admin/dashboard'
  if (n.link) return n.link

  const type = (n.type || '').toUpperCase()
  const data = n.data || {}

  switch (type) {
    case 'ORDER':
      return data.orderId ? `/admin/orders/${data.orderId}` : '/admin/orders'
    case 'RETURN':
      return data.returnId ? `/admin/returns/${data.returnId}` : '/admin/returns'
    case 'MESSAGE':
      return '/admin/messages'
    case 'USER':
      return '/admin/users'
    case 'SYSTEM':
    default:
      return '/admin/dashboard'
  }
}

export function getNotificationIcon(n) {
  if (n?.icon) return n.icon
  const type = (n?.type || '').toUpperCase()
  return TYPE_ICON[type] ?? '🔔'
}


export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)

  // Live notifications accumulated this session (newest first, capped at 50)
  const [liveNotifications, setLiveNotifications] = useState([])
  // Unread count — incremented on new socket event, decremented on mark-read
  const [unreadCount, setUnreadCount] = useState(0)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    // Only connect for admins
    if (!isAdmin) return

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      // Socket.IO will automatically send cookies (including httpOnly ones)
      // when withCredentials is true and the server allows the origin.
      // Do NOT pass auth.cookie manually — httpOnly cookies are inaccessible
      // to JS via document.cookie and must be sent by the browser automatically.
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id)
    })

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message)
    })

    // Listen for all notification event types
    NOTIFICATION_EVENTS.forEach((event) => {
      socket.on(event, (payload) => {
        const notification = {
          ...payload,
          // Ensure a local _id fallback if server didn't send one
          _id: payload._id ?? `local-${Date.now()}`,
          icon: getNotificationIcon(payload),
          link: getNotificationLink(payload),
          readByMe: false,
        }

        setLiveNotifications((prev) => [notification, ...prev].slice(0, 50))
        setUnreadCount((n) => n + 1)
      })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [isAdmin])

  // Reset when admin logs out
  useEffect(() => {
    if (!isAdmin) {
      setLiveNotifications([])
      setUnreadCount(0)
    }
  }, [isAdmin])

  const markOneRead = (id) => {
    setLiveNotifications((prev) => prev.filter((n) => n._id !== id))
    setUnreadCount((n) => Math.max(0, n - 1))
  }

  const markAllRead = () => {
    setLiveNotifications([])
    setUnreadCount(0)
  }

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      liveNotifications,
      unreadCount,
      setUnreadCount,
      markOneRead,
      markAllRead,
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
