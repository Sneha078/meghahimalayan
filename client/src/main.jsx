import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { WishlistProvider } from './context/WishlistContext'
import { RewardsProvider } from './context/RewardsContext'

import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <AuthProvider>
      <RewardsProvider>
      <WishlistProvider>
      <CartProvider>
        <App />
      </CartProvider>
      </WishlistProvider>
      </RewardsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)