import { useAuth } from '../../context/AuthContext'
import { Navigate } from 'react-router-dom'

// Route guard for admin/panel pages.
// Pass `roles={['admin', 'intern']}` where staff should also be allowed
// (e.g. product management). Defaults to admin-only.
function AdminRoute({ children, roles = ['admin'] }){
    const{ user, loading } = useAuth()

    if(loading) return null

    if(!user) return <Navigate to="/admin/login" replace />

    if(!roles.includes(user.role)){
        // Intern hitting an admin-only page → send them to their area
        return user.role === 'intern'
            ? <Navigate to="/admin/products" replace />
            : <Navigate to="/admin/login" replace />
    }

    return children
}

export default AdminRoute