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

const TYPE_ICON = {
  ORDER:   '🛒',
  RETURN:  '↩️',
  MESSAGE: '✉️',
  USER:    '👤',
  SYSTEM:  '⚙️',
}

const TYPE_LINK = {
  ORDER:   (d) => d?.orderId   ? `/admin/orders/${d.orderId}`   : '/admin/orders',
  RETURN:  (d) => d?.returnId  ? `/admin/returns/${d.returnId}` : '/admin/returns',
  MESSAGE: (d) => '/admin/messages',
  USER:    (d) => d?.userId    ? `/admin/users`                 : '/admin/users',
  SYSTEM:  ()  => '/admin/dashboard',
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
          icon: TYPE_ICON[payload.type] ?? '🔔',
          link: TYPE_LINK[payload.type]?.(payload.data) ?? '/admin/dashboard',
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
    setLiveNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, readByMe: true } : n))
    )
    setUnreadCount((n) => Math.max(0, n - 1))
  }

  const markAllRead = () => {
    setLiveNotifications((prev) => prev.map((n) => ({ ...n, readByMe: true })))
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

export { TYPE_ICON, TYPE_LINK }
