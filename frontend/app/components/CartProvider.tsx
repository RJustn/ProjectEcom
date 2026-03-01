"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: number;
  name: string;
  price: number;
  qty: number;
  stock: number;
  imageUrl?: string;
};

type AddItemPayload = {
  id: number;
  name: string;
  price: number;
  qty: number;
  stock: number;
  imageUrl?: string;
};

type CartContextType = {
  items: CartItem[];
  isOpen: boolean;
  itemCount: number;
  total: number;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: AddItemPayload) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "ecom_cart_items";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) setItems(parsed);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (payload: AddItemPayload) => {
    setItems((current) => {
      const found = current.find((entry) => entry.id === payload.id);
      const safeQty = Math.max(1, Math.floor(payload.qty));
      const safeStock = Math.max(0, Math.floor(payload.stock));
      const currentQty = found?.qty ?? 0;
      const remaining = Math.max(0, safeStock - currentQty);
      const addQty = Math.min(safeQty, remaining);

      if (addQty <= 0) {
        return current;
      }

      if (found) {
        return current.map((entry) =>
          entry.id === payload.id
            ? {
                ...entry,
                qty: entry.qty + addQty,
                stock: safeStock,
              }
            : entry,
        );
      }
      return [{ ...payload, qty: addQty, stock: safeStock }, ...current];
    });
    setIsOpen(true);
  };

  const removeItem = (id: number) => {
    setItems((current) => current.filter((entry) => entry.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const value = useMemo<CartContextType>(
    () => ({
      items,
      isOpen,
      itemCount: items.reduce((sum, item) => sum + item.qty, 0),
      total: items.reduce((sum, item) => sum + item.price * item.qty, 0),
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      removeItem,
      clearCart,
    }),
    [items, isOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
