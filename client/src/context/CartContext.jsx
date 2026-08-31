import { createContext, useContext, useState } from "react";

const CartContext = createContext()

export function CartProvider({ children }){
    const [cartItems, setCartItems] = useState([])

 const addItem = (product) => {
    const qty = product.quantity ?? 1

    setCartItems((prev) => {
        const existing = prev.find((item) => item.id === product.id)
        if (existing) {
            return prev.map((item) =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + qty }
                    : item
            )
        }
        return [...prev, { ...product, quantity: qty }]
    })
}

    const updateQuantity = (id, delta) => {
        setCartItems((prev) =>
        prev.map((item)=>
        item.id ===id
    ? {...item, quantity: Math.max(1, item.quantity + delta) }
: item
)
)
    }
    const removeItem = (id) => {
        setCartItems((prev) => prev.filter((item) => item.id !==id))
    }
    const clearCart = () => setCartItems([])
    const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity, 0
    )
    const totalItems = cartItems.reduce(
        (sum, item) => sum + item.quantity, 0
    )

    return (
        <CartContext.Provider value={{
            cartItems,
            addItem,
            updateQuantity,
            removeItem,
            clearCart,
            subtotal,
            totalItems,
        }}>
            {children}
        </CartContext.Provider>
    )

}

export function useCart() {
    return useContext(CartContext)
}