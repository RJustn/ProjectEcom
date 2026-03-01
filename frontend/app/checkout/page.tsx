"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import { useCart } from "../components/CartProvider";
import { formatPrice } from "../utils/formatPrice";
import { apiUrl } from "../utils/api";

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [placingOrder, setPlacingOrder] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handlePlaceOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (items.length === 0) return;

    setPlacingOrder(true);
    setError(null);

    try {
      const response = await fetch(apiUrl("/users/checkout/paymongo"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.qty,
          })),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to create checkout session");
      }

      const checkoutUrl = payload?.checkoutUrl;
      if (!checkoutUrl) {
        throw new Error("Missing checkout URL from payment provider");
      }

      localStorage.setItem("checkoutEmail", email);
      window.location.href = checkoutUrl;
    } catch (e: any) {
      setError(e?.message || "Checkout failed");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Checkout</h1>
          <p className="text-gray-600 mt-1">Complete your order by providing your details below</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Billing Information</h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handlePlaceOrder} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                </div>

                {/* Shipping Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Shipping Address</label>
                  <textarea
                    required
                    placeholder="Street address, city, postal code..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Payment Method</label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer me-3 hover:bg-gray-50 transition">
                      <input type="radio" name="payment" defaultChecked className="w-4 h-4 text-green-600 focus:ring-green-500" />
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        <span className="block">GCash</span>
                        <span className="text-xs text-gray-500">Quick and secure</span>
                      </span>
                    </label>
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg me-3 cursor-pointer hover:bg-gray-50 transition">
                      <input type="radio" name="payment" className="w-4 h-4 text-green-600 focus:ring-green-500" />
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        <span className="block">PayMaya</span>
                        <span className="text-xs text-gray-500">Instant wallet payment</span>
                      </span>
                    </label>
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                      <input type="radio" name="payment" className="w-4 h-4 text-green-600 focus:ring-green-500" />
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        <span className="block">Credit Card</span>
                        <span className="text-xs text-gray-500">Visa, Mastercard, etc.</span>
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={placingOrder}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed mt-8"
                >
                  {placingOrder ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Processing...
                    </span>
                  ) : (
                    "Complete Purchase"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sticky top-20 h-fit">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

              {items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-sm">Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6 max-h-72 overflow-y-auto pr-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500 mt-1">Qty: {item.qty}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 text-right">₱{formatPrice(item.price * item.qty)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Subtotal</span>
                      <span className="text-sm text-gray-900">₱{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Shipping</span>
                      <span className="text-sm text-gray-900">Free</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-green-600">₱{formatPrice(total)}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 text-center">
                    <p>By completing this purchase, you agree to our</p>
                    <Link href="/" className="text-green-600 hover:text-green-700 font-medium">
                      Terms of Service
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
