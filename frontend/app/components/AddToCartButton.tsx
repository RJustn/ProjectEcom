"use client";

import React, { useMemo, useState } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useCart } from "./CartProvider";

type Props = {
  id: number;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  variant?: "default" | "card";
};

export default function AddToCartButton({ id, name, price, stock, imageUrl, variant = "default" }: Props) {
  const { isSignedIn } = useAuth();
  const { addItem, items } = useCart();
  const [qty, setQty] = useState(1);

  const inCartQty = useMemo(() => items.find((item) => item.id === id)?.qty ?? 0, [items, id]);
  const remainingStock = Math.max(0, stock - inCartQty);

  const handle = () => {
    if (remainingStock <= 0) return;
    const safeQty = Math.max(1, Math.floor(qty));
    const finalQty = Math.min(safeQty, remainingStock);
    addItem({ id, name, price, stock, qty: finalQty, imageUrl });
    setQty(1);
  };

  const decreaseQty = () => {
    setQty((current) => Math.max(1, current - 1));
  };

  const increaseQty = () => {
    setQty((current) => Math.min(Math.max(1, remainingStock), current + 1));
  };

  if (!isSignedIn) {
    if (variant === "card") {
      return (
        <div className="w-full">
          <div className="w-full border border-green-200 rounded-lg px-3 py-1.5 flex items-center justify-between bg-white">
            <button
              type="button"
              className="text-green-900 text-xl font-semibold px-2"
              aria-label="Decrease quantity"
              disabled
            >
              -
            </button>
            <span className="font-semibold text-gray-900">1</span>
            <button
              type="button"
              className="text-green-900 text-xl font-semibold px-2"
              aria-label="Increase quantity"
              disabled
            >
              +
            </button>
          </div>
          <SignInButton>
            <button className="w-full mt-2 bg-green-900 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-green-950 transition">
              Sign in to add
            </button>
          </SignInButton>
        </div>
      );
    }

    return (
      <SignInButton>
        <button className="btn-danger-outline">Sign in to add</button>
      </SignInButton>
    );
  }

  if (variant === "card") {
    return (
      <div className="w-full">
        <div className="w-full border border-green-200 rounded-lg px-3 py-1.5 flex items-center justify-between bg-white">
          <button
            type="button"
            onClick={decreaseQty}
            className="text-green-900 text-xl font-semibold px-2 disabled:text-gray-400"
            aria-label="Decrease quantity"
            disabled={remainingStock <= 0 || qty <= 1}
          >
            -
          </button>
          <span className="font-semibold text-gray-900">{remainingStock <= 0 ? 0 : qty}</span>
          <button
            type="button"
            onClick={increaseQty}
            className="text-green-900 text-xl font-semibold px-2 disabled:text-gray-400"
            aria-label="Increase quantity"
            disabled={remainingStock <= 0 || qty >= Math.max(1, remainingStock)}
          >
            +
          </button>
        </div>

        <button
          onClick={handle}
          className="w-full mt-2 bg-green-900 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-green-950 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={remainingStock <= 0}
        >
          {remainingStock <= 0 ? "Out of stock" : "Add to Cart"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
        Quantity*
      <input
        type="number"
        min={1}
        max={Math.max(1, remainingStock)}
        value={qty}
        onChange={(e) => {
          const value = Number(e.target.value);
          if (!Number.isFinite(value)) {
            setQty(1);
            return;
          }
          const clamped = Math.min(Math.max(1, Math.floor(value)), Math.max(1, remainingStock));
          setQty(clamped);
        }}
        className="w-16 border rounded px-2 py-2"
        disabled={remainingStock <= 0}
      />
      <button onClick={handle} className="btn-danger" disabled={remainingStock <= 0}>
        {remainingStock <= 0 ? "Out of stock" : "Add to Cart"}
      </button>
    </div>
  );
}
