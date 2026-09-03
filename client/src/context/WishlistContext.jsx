import { createContext, useContext, useState, useEffect } from "react"
import { getWishlist, addToWishlist, removeFromWishlist } from '../api/productClient'
import { useAuth } from './AuthContext'

const WishlistContext = createContext()

export function WishlistProvider({ children }){
    const { user } = useAuth()
    const[wishlist, setWishlist] = useState([])

    useEffect(()=> {
        if(!user){
            setWishlist([])
            return
        }

        getWishlist()
        .then((data)=>setWishlist(data.wishlist ?? []))
        .catch(() => setWishlist([]))
    }, [user])

     const isWishlisted = (productId) => {
    return wishlist.some(
      (item) => (item._id ?? item.id) === productId
    )
  }

  const toggleWishlist = async (product)=> {
    if(!user) return false
    
    const productId = product._id ?? product.id

    if (isWishlisted(productId)){
        setWishlist((prev)=> prev.filter((item)=>(item._id ?? item.id) !== productId))
        try {
            await removeFromWishlist(productId)
        } catch{
            setWishlist((prev)=> [...prev, product])
        }
    } else {
        setWishlist((prev) => [...prev, product])
        try{
            await addToWishlist(productId)
        } catch {
            setWishlist((prev) => prev.filter((item) => (item._id ?? item.id!== productId)))
        }
    }
    return true
  } 
  return (
     <WishlistContext.Provider value={{
      wishlist,
      isWishlisted,
      toggleWishlist,
      totalWishlisted: wishlist.length,
    }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
    return useContext(WishlistContext)
}