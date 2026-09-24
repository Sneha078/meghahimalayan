const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

async function handleResponse(res) {
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong')
  }
  return data
}

// Update user profile
export async function updateProfile({ name, email, phone, avatar }) {
  const res = await fetch(`${API_URL}/me/update`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, phone, avatar }),
  })
  return handleResponse(res)
}

// Get current user profile
export async function getProfile() {
  const res = await fetch(`${API_URL}/me`, {
    credentials: 'include',
  })
  return handleResponse(res)
}

// Update user password (separate endpoint for security)
export async function updatePassword({ currentPassword, newPassword }) {
  const res = await fetch(`${API_URL}/password/update`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
  })
  return handleResponse(res)
}