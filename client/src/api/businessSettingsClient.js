const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

async function handleResponse(res) {
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong')
  }
  return data
}

// Get business settings (public)
export async function getBusinessSettings() {
  const res = await fetch(`${API_URL}/business-settings`, {
    credentials: 'include',
  })
  return handleResponse(res)
}

// Update business settings (admin only)
export async function updateBusinessSettings(settingsData) {
  const res = await fetch(`${API_URL}/admin/business-settings`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settingsData),
  })
  return handleResponse(res)
}