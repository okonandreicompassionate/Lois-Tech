"use client";

import { createContext, useContext, useMemo, useState, useEffect } from "react";

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  image_url: string;
  size: string;
  price: number;
  quantity: number;
  max_quantity?: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, size: string) => void;
  updateQuantity: (id: string, size: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const storedCart = localStorage.getItem("exiles-cart");
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch {
        setCartItems([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("exiles-cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (incomingItem: CartItem) => {
    const maxAllowed = incomingItem.max_quantity ?? Number.POSITIVE_INFINITY;

    setCartItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.id === incomingItem.id &&
          item.size === incomingItem.size
      );

      const nextQuantity = (existing?.quantity ?? 0) + 1;
      if (nextQuantity > maxAllowed) {
        alert(`Only ${maxAllowed} available in stock.`);
        return prev;
      }

      if (existing) {
        return prev.map((item) =>
          item.id === incomingItem.id &&
          item.size === incomingItem.size
            ? { ...item, quantity: nextQuantity }
            : item
        );
      }

      return [...prev, { ...incomingItem, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string, size: string) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.id === id && item.size === size))
    );
  };

  const updateQuantity = (id: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id, size);
      return;
    }

    setCartItems((prev) => {
      const target = prev.find((item) => item.id === id && item.size === size);
      const maxAllowed = target?.max_quantity ?? Number.POSITIVE_INFINITY;

      if (quantity > maxAllowed) {
        alert(`Only ${maxAllowed} available in stock.`);
        return prev;
      }

      return prev.map((item) =>
        item.id === id && item.size === size
          ? { ...item, quantity }
          : item
      );
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) =>
          total +
          (Number(item.price) || 0) *
          (Number(item.quantity) || 0),
        0
      ),
    [cartItems]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}