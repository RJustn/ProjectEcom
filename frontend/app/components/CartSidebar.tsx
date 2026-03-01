"use client";

import { useCart } from "./CartProvider";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "../utils/formatPrice";

export default function CartSidebar() {
  const pathname = usePathname();
  const { isOpen, openCart, closeCart, items, itemCount, total, removeItem, clearCart } = useCart();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {/* trigger button (visible on small screens) */}
      <div className="fixed right-4 bottom-6 z-40">
        <button
          onClick={openCart}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-xl text-white shadow-lg ring-1 ring-black/5 transition hover:bg-green-700 hover:shadow-xl"
          title="Shopping Cart"
          aria-label="Open shopping cart"
        >
          <i className="bi bi-cart3"></i>

          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 bg-red-500 text-white text-[11px] rounded-full flex items-center justify-center font-semibold leading-none">
              {itemCount}
            </span>
          )}
        </button>
      </div>

      {/* overlay */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
          onClick={closeCart}
        />

        <aside
          className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col transition-transform duration-300 ease-out transform-gpu will-change-transform ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
            <div className="px-6 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Shopping Cart</h3>
                  <p className="text-sm text-gray-500">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearCart}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition"
                  >
                  Clear
                  </button>
                  <button
                    onClick={closeCart}
                    className="h-9 w-9 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
                    aria-label="Close cart"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {items.length === 0 ? (
                <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mb-4">
                    <i className="bi bi-cart3 text-2xl"></i>
                  </div>
                  <p className="text-base font-medium text-gray-800 mb-1">Your cart is empty</p>
                  <p className="text-sm text-gray-500">Add vitamins and wellness essentials to get started.</p>
                </div>
              ) : (
                <div className="space-y-3 ms-2 me-2">
                  {items.map((it) => (
                    <li key={it.id} className="flex gap-3 items-center rounded-xl border border-gray-200 p-3 bg-white">
                      {it.imageUrl ? (
                        <img src={it.imageUrl} alt={it.name} className="w-16 h-16 object-cover rounded-lg border border-gray-100" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400">
                          <i className="bi bi-image"></i>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <div className="font-medium text-gray-900 break-words leading-snug">{it.name}</div>
                            <div className="text-sm text-gray-500">Qty: {it.qty}</div>
                          </div>
                          <div className="font-semibold text-gray-900">₱{formatPrice(it.price * it.qty)}</div>
                        </div>
                        <div className="mt-2">
                          <button
                            onClick={() => removeItem(it.id)}
                            className="px-2.5 py-1 text-xs font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-600">Subtotal</div>
                <div className="text-xl font-semibold text-gray-900">₱{formatPrice(total)}</div>
              </div>
              {items.length === 0 ? (
                <button
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-medium opacity-60"
                  disabled
                >
                  Checkout
                </button>
              ) : (
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-center font-medium transition"
                >
                  Checkout
                </Link>
              )}
            </div>
          </aside>
      </div>
    </>
  );
}
