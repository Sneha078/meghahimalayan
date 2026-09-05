import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import ProductDetails from './pages/ProductDetails'
import OrderConfirmation from './pages/OrderConfirmation'
import LoginPage from './features/Auth/LoginPage'
import SignupPage from './features/Auth/SignupPage'
import ForgotPasswordPage from './features/Auth/ForgotPasswordPage'
import ResetPasswordPage from './features/Auth/ResetPasswordPage'
import AdminLoginPage from './features/Auth/AdminLoginPage'
import AccountPage from './pages/AccountPage'
import RewardsPage from './pages/RewardsPage'
import SearchResults from './components/SearchResults'
import Orders from './pages/Orders'
import Wishlist from './pages/Wishlist'
import AdminRoute from './components/admin/AdminRoute'
import AdminLayout from './components/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Analytics from './pages/admin/Analytics'
import AdminOrders from './pages/admin/AdminOrders'
import AdminOrderDetail from './pages/admin/AdminOrderDetail'
import AdminProducts from './pages/admin/AdminProducts'
import AdminProductForm from './pages/admin/AdminProductForm'
import AdminUsers from './pages/admin/AdminUsers'
import AdminCoupons from './pages/admin/AdminCoupons'
import AdminMessages from './pages/admin/AdminMessages'
import Shipping from './pages/Shipping'
import Returns from './pages/Returns'
import FAQ from './pages/FAQ'
import Contact from './pages/Contact'



function ScrollToTop() {
  const {pathname, search } = useLocation()

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    })
  }, [pathname, search])
  return null
}


function App() {
  return (
    <div>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart"  element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
         <Route path="/order-confirmation" element={<OrderConfirmation />} />
         <Route path="/login" element={<LoginPage />} />
         <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/password/reset/:token" element={<ResetPasswordPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path='/account' element={<AccountPage />} />
        <Route path="/rewards" element={<RewardsPage></RewardsPage>} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/wishlist" element={<Wishlist />} />
      
<Route path="/admin/dashboard" element={
  <AdminRoute>
    <AdminLayout><Dashboard /></AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/analytics" element={
  <AdminRoute>
    <AdminLayout><Analytics /></AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/orders" element={
  <AdminRoute>
    <AdminLayout><AdminOrders /></AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/orders/:id" element={
  <AdminRoute>
    <AdminLayout><AdminOrderDetail /></AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/products" element={
  <AdminRoute>
    <AdminLayout><AdminProducts /></AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/products/new" element={
  <AdminRoute>
    <AdminLayout><AdminProductForm /></AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/products/:id/edit" element={
  <AdminRoute>
    <AdminLayout><AdminProductForm /></AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/users" element={
  <AdminRoute>
    <AdminLayout><AdminUsers /></AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/coupons" element={
  <AdminRoute>
    <AdminLayout><AdminCoupons /></AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/messages" element={
  <AdminRoute>
    <AdminLayout><AdminMessages /></AdminLayout>
  </AdminRoute>
} />
<Route path='/shipping' element={<Shipping/>} />
<Route path='/returns' element={<Returns/>} />
<Route path='/faq' element={<FAQ/>} />
<Route path='/contact' element={<Contact/>} />
    
      </Routes>
      <Footer />
    </div>
  )
}

export default App

