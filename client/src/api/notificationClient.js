const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Something went wrong')
  return data
}

export const getNotifications = (page = 1, limit = 20) =>
  fetch(`${API_URL}/notifications?page=${page}&limit=${limit}`, {
    credentials: 'include',
  }).then(handleResponse)

export const getUnreadCount = () =>
  fetch(`${API_URL}/notifications/unread`, {
    credentials: 'include',
  }).then(handleResponse)

export const markAsRead = (id) =>
  fetch(`${API_URL}/notifications/${id}/read`, {
    method: 'PUT',
    credentials: 'include',
  }).then(handleResponse)

export const markAllAsRead = () =>
  fetch(`${API_URL}/notifications/read-all`, {
    method: 'PUT',
    credentials: 'include',
  }).then(handleResponse)
