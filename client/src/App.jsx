import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import ProductDetail from './pages/ProductDetail'
import SearchResults from './components/SearchResults'
import ProductDetails from './pages/ProductDetails'
import OrderConfirmation from './pages/OrderConfirmation'
import LoginPage from './features/Auth/LoginPage'

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/shop"        element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart"        element={<Cart />} />
        <Route path="/checkout"    element={<Checkout />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App
