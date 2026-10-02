import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, Suspense, lazy } from 'react'
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
import Shipping from './pages/Shipping'
import Returns from './pages/Returns'
import ReturnRequest from './pages/ReturnRequest'
import MyReturns from './pages/MyReturns'
import FAQ from './pages/FAQ'
import Contact from './pages/Contact'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import OrderFailed from './pages/OrderFailed'
import HowToChooseEyewear from './pages/HowToChooseEyewear'
import NotFound from "./pages/NotFound";

// Error handling and loading components
import ErrorBoundary from './components/ErrorBoundary'
import { AdminLoadingFallback, PageLoadingFallback } from './components/LoadingFallback'


// Lazy load admin components to reduce main bundle size
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const Analytics = lazy(() => import('./pages/admin/Analytics'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminUserDetail = lazy(() => import('./pages/admin/AdminUserDetail'))
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'))
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'))
const AdminReturns = lazy(() => import('./pages/admin/AdminReturns'))
const AdminReturnDetail = lazy(() => import('./pages/admin/AdminReturnDetail'))
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'))
import AdminMediaLibrary from './pages/admin/AdminMediaLibrary'


function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '')
      const attempt = (retries = 0) => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else if (retries < 10) {
          setTimeout(() => attempt(retries + 1), 100)
        }
      }
      setTimeout(() => attempt(), 50)
      return
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, search, hash])
  return null
}

// Loading component for lazy-loaded admin pages
function AdminPageLoader() {
  return <AdminLoadingFallback />
}


function App() {
  return (
    <ErrorBoundary 
      message="The application encountered an unexpected error. Please try refreshing the page."
      fallback={(error, retry) => (
        <PageLoadingFallback 
          message={`Application Error: ${error?.message || 'Something went wrong'}`}
          showSpinner={false}
        />
      )}
    >
      <div style={{ overflowX: 'clip', width: '100%' }}>
        <ScrollToTop />
        
        <ErrorBoundary message="Navigation failed to load properly.">
          <Navbar />
        </ErrorBoundary>
        
        <ErrorBoundary message="Page content failed to load.">
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
    <AdminLayout>
      <ErrorBoundary message="Dashboard failed to load.">
        <Suspense fallback={<AdminPageLoader />}>
          <Dashboard />
        </Suspense>
      </ErrorBoundary>
    </AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/analytics" element={
  <AdminRoute>
    <AdminLayout>
      <ErrorBoundary message="Analytics page failed to load.">
        <Suspense fallback={<AdminPageLoader />}>
          <Analytics />
        </Suspense>
      </ErrorBoundary>
    </AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/orders" element={
  <AdminRoute>
    <AdminLayout>
      <ErrorBoundary message="Orders page failed to load.">
        <Suspense fallback={<AdminPageLoader />}>
          <AdminOrders />
        </Suspense>
      </ErrorBoundary>
    </AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/orders/:id" element={
  <AdminRoute>
    <AdminLayout>
      <ErrorBoundary message="Order details failed to load.">
        <Suspense fallback={<AdminPageLoader />}>
          <AdminOrderDetail />
        </Suspense>
      </ErrorBoundary>
    </AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/products" element={
  <AdminRoute roles={['admin', 'intern']}>
    <AdminLayout>
      <ErrorBoundary message="Products page failed to load.">
        <Suspense fallback={<AdminPageLoader />}>
          <AdminProducts />
        </Suspense>
      </ErrorBoundary>
    </AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/products/new" element={
  <AdminRoute roles={['admin', 'intern']}>
    <AdminLayout>
      <ErrorBoundary message="Product form failed to load.">
        <Suspense fallback={<AdminPageLoader />}>
          <AdminProductForm />
        </Suspense>
      </ErrorBoundary>
    </AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/products/:id/edit" element={
  <AdminRoute roles={['admin', 'intern']}>
    <AdminLayout>
      <ErrorBoundary message="Product edit form failed to load.">
        <Suspense fallback={<AdminPageLoader />}>
          <AdminProductForm />
        </Suspense>
      </ErrorBoundary>
    </AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/users" element={
  <AdminRoute>
    <AdminLayout>
      <ErrorBoundary message="Users page failed to load.">
        <Suspense fallback={<AdminPageLoader />}>
          <AdminUsers />
        </Suspense>
      </ErrorBoundary>
    </AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/media" element={
  <AdminRoute roles={['admin', 'intern']}>
    <AdminLayout>
      <ErrorBoundary message="Media Library failed to load.">
        <Suspense fallback={<AdminPageLoader />}>
          <AdminMediaLibrary />
        </Suspense>
      </ErrorBoundary>
    </AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/users/:id" element={
  <AdminRoute>
    <AdminLayout>
      <ErrorBoundary message="User details failed to load.">
        <Suspense fallback={<AdminPageLoader />}>
          <AdminUserDetail />
        </Suspense>
      </ErrorBoundary>
    </AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/coupons" element={
  <AdminRoute>
    <AdminLayout>
      <ErrorBoundary message="Coupons page failed to load.">
        <Suspense fallback={<AdminPageLoader />}>
          <AdminCoupons />
        </Suspense>
      </ErrorBoundary>
    </AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/messages" element={
  <AdminRoute>
    <AdminLayout>
      <ErrorBoundary message="Messages page failed to load.">
        <Suspense fallback={<AdminPageLoader />}>
          <AdminMessages />
        </Suspense>
      </ErrorBoundary>
    </AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/returns" element={
  <AdminRoute>
    <AdminLayout>
      <ErrorBoundary message="Returns page failed to load.">
        <Suspense fallback={<AdminPageLoader />}>
          <AdminReturns />
        </Suspense>
      </ErrorBoundary>
    </AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/returns/:id" element={
  <AdminRoute>
    <AdminLayout>
      <ErrorBoundary message="Return details failed to load.">
        <Suspense fallback={<AdminPageLoader />}>
          <AdminReturnDetail />
        </Suspense>
      </ErrorBoundary>
    </AdminLayout>
  </AdminRoute>
} />
<Route path="/admin/notifications" element={
  <AdminRoute>
    <AdminLayout>
      <ErrorBoundary message="Notifications page failed to load.">
        <Suspense fallback={<AdminPageLoader />}>
          <AdminNotifications />
        </Suspense>
      </ErrorBoundary>
    </AdminLayout>
  </AdminRoute>
} />

<Route path='/shipping' element={<Shipping/>} />
<Route path='/returns' element={<Returns/>} />
<Route path='/order/:id/return' element={<ReturnRequest />} />
<Route path='/my-returns' element={<MyReturns />} />
<Route path='/faq' element={<FAQ/>} />
<Route path='/contact' element={<Contact/>} />
< Route path='/privacy' element={<Privacy/>} /> 
<Route path='/terms' element={<Terms />} />
<Route path ='/order-failed' element={<OrderFailed />} />  
<Route path='/how-to-choose-eyewear' element={<HowToChooseEyewear />} />
<Route path="*" element={<NotFound />} />

          </Routes>
        </ErrorBoundary>
        
        <ErrorBoundary message="Footer failed to load properly.">
          <Footer />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  )
}

export default App

