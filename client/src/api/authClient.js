const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api/v1'

// =========================
// Handle API Response
// =========================

async function handleResponse(res) {
  const data = await res.json()

  if (!res.ok) {
    throw new Error(
      data.message || 'Something went wrong'
    )
  }

  return data
}

// =========================
// Register
// =========================

export async function registerUser({
  name,
  email,
  password,
  phone,
}) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      email,
      password,
      phone,
    }),
  })

  return handleResponse(res)
}

// =========================
// Login
// =========================

export async function loginUser({
  email,
  password,
}) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  return handleResponse(res)
}

// =========================
// Logout
// =========================

export async function logoutUser() {
  const res = await fetch(`${API_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  })

  return handleResponse(res)
}

// =========================
// Current User
// =========================

export async function fetchCurrentUser() {
  const res = await fetch(`${API_URL}/me`, {
    credentials: 'include',
  })

  if (res.status === 401) {
    return null
  }

  return handleResponse(res)
}

// =========================
// Forgot Password
// =========================

export async function forgotPassword({ email }) {
  const res = await fetch(
    `${API_URL}/password/forgot`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    }
  )

  return handleResponse(res)
}

// =========================
// Reset Password
// =========================

export async function resetPassword({
  token,
  password,
  confirmPassword,
}) {
  const res = await fetch(
    `${API_URL}/password/reset/${token}`,
    {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password,
        confirmPassword,
      }),
    }
  )

  return handleResponse(res)
}

// =========================
// Google Login
// =========================

// Sends Google ID/access token to backend.
// Backend verifies the token and creates/logs in the user.

export async function googleLoginUser({
  idToken,
  accessToken,
}) {
  if (!idToken && !accessToken) {
    throw new Error(
      'Google token was not received'
    )
  }

  const res = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idToken,
      accessToken,
    }),
  })

  return handleResponse(res)
}