import { useAuth } from '../../context/AuthContext'
import { Navigate } from 'react-router-dom'

function AdminRoute({ children }){
    const{ user, loading } = useAuth()

    if(loading) return null

    if(!user) return <Navigate to ="/admin/login" replace />

    if(user.role !== 'admin') return <Navigate to ="/admin/login" replace />
    
    return children
}

export default AdminRoute