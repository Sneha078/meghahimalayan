import { createContext, useContext, useState, useEffect } from 'react'
import { fetchCurrentUser, loginUser, registerUser, logoutUser, googleLoginUser } from '../api/authClient'

const AuthContext = createContext()

export function AuthProvider({ children}) {
    const [ user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCurrentUser()
        .then((data) => setUser(data?.user ?? null))
        .catch(() => setUser(null))
        .finally(()=> setLoading(false))
    }, [])

    const login = async ({ email, password}) => {
        const data = await loginUser ({ email, password})
        setUser(data.user)
        return data
    }

    const signup = async ({name, email, password, phone}) =>{
        const data = await registerUser({ name, email, password, phone})
        setUser(data.user)
        return data
    }

    const logout = async() => {
        await logoutUser()
        setUser(null)
    }

    // Called after @react-oauth/google useGoogleLogin returns access_token
    const googleLogin = async (accessToken) => {
        const data = await googleLoginUser({ accessToken })
        setUser(data.user)
        return data
    }

    return(
        <AuthContext.Provider value={{ user, loading, login, signup, logout, googleLogin }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(){
    return useContext(AuthContext)
}