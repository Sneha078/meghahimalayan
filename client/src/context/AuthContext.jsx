import { createContext, useContext, useState, useEffect } from 'react'
import { clearUserCache } from '../api/cachedClient'

import {
  fetchCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
  googleLoginUser,
  updateProfile as updateProfileApi,
} from '../api/authClient'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCurrentUser()
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async ({ email, password }) => {
    const data = await loginUser({ email, password })
    setUser(data.user)
    // Clear cache to prevent data leakage between users
    clearUserCache()
    return data
  }

  const signup = async ({
    name,
    email,
    password,
    phone,
    marketingOptIn,
  }) => {
    const data = await registerUser({
      name,
      email,
      password,
      phone,
      marketingOptIn,
    })

    setUser(data.user)
    // Clear cache for new user
    clearUserCache()
    return data
  }

  const updateProfile = async (fields) => {
    const data = await updateProfileApi(fields)
    setUser(data.user)
    return data
  }

  const logout = async () => {
    await logoutUser()
    setUser(null)
    // Clear all cached data on logout
    clearUserCache()
  }

  // Google login
  const loginWithGoogle = async ({
    idToken,
    accessToken,
  }) => {
    const data = await googleLoginUser({
      idToken,
      accessToken,
    })

    setUser(data.user)
    // Clear cache to prevent data leakage between users
    clearUserCache()
    return data
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        signup,
        logout,
        loginWithGoogle,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}