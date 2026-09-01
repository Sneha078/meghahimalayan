import { Routes, Route } from 'react-router-dom'
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
import SearchResults from './components/SearchResults'


        


function App() {
  return (
    <div>
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
        <Route path="/search" element={<SearchResults />} />


         
      </Routes>
      <Footer />
    </div>
  )
}

export default App

