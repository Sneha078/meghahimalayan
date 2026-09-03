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
import Account from './pages/Account'
import RewardsPage from './pages/RewardsPage'
import SearchResults from './components/SearchResults'
import Orders from './pages/Orders'
import Wishlist from './pages/Wishlist'


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
        <Route path='/account' element={<Account />} />
        <Route path="/rewards" element={<RewardsPage></RewardsPage>} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/wishlist" element={<Wishlist />} />




         
      </Routes>
      <Footer />
    </div>
  )
}

export default App

