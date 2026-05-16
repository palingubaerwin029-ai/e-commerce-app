import React, { createContext, useState, useContext, useCallback, useMemo, useEffect, useRef } from 'react';
import { AuthContext } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const { user } = useContext(AuthContext);
  const prevUserId = useRef(user?.id);

  // Clear cart when user changes (login/logout/signup)
  useEffect(() => {
    if (prevUserId.current !== user?.id) {
      setCartItems([]);
      prevUserId.current = user?.id;
    }
  }, [user?.id]);

  const addToCart = useCallback((product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        // If it already exists, increase the quantity
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // Otherwise, add it with quantity 1
      return [...prevItems, { ...product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
    } else {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  }, []);

  const value = useMemo(
    () => ({ cartItems, addToCart, removeFromCart, clearCart, updateQuantity }),
    [cartItems, addToCart, removeFromCart, clearCart, updateQuantity]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
