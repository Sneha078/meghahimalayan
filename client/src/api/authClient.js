
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

async function handleResponse(res) {
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong')
  }
  return data
}


export async function registerUser({ name, email, password, phone }) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    credentials: 'include',          // saves the httpOnly cookie automatically
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone }),
  })
  return handleResponse(res)
}


export async function loginUser({ email, password }) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return handleResponse(res)
}


export async function logoutUser() {
  const res = await fetch(`${API_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  return handleResponse(res)
}


export async function fetchCurrentUser() {
  const res = await fetch(`${API_URL}/me`, {
    credentials: 'include',
  })
  if (res.status === 401) return null  
  return handleResponse(res)
}


export async function forgotPassword({ email }) {
  const res = await fetch(`${API_URL}/password/forgot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return handleResponse(res)
}


export async function resetPassword({ token, password, confirmPassword }) {
  const res = await fetch(`${API_URL}/password/reset/${token}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, confirmPassword }),
  })
  return handleResponse(res)
}
