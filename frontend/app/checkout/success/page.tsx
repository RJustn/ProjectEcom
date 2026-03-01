"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import { useCart } from "../../components/CartProvider";
import { apiUrl } from "../../utils/api";

function CheckoutSuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const processedOrderIdsRef = useRef<Set<string>>(new Set());
  const { clearCart } = useCart();
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Finalizing your order...");

  useEffect(() => {
    if (!orderId) {
      setState("error");
      setMessage("Missing order reference. Please contact support.");
      return;
    }

    if (processedOrderIdsRef.current.has(orderId)) {
      return;
    }
    processedOrderIdsRef.current.add(orderId);

    const finalize = async () => {
      try {
        const response = await fetch(apiUrl(`/users/orders/${orderId}/confirm-paid`), {
          method: "POST",
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.message || "Failed to confirm payment");
        }

        clearCart();
        setState("ok");
        setMessage("Payment confirmed and order placed successfully!");
      } catch (e: any) {
        setState("error");
        setMessage(e?.message || "Could not finalize your order.");
      }
    };

    finalize();
  }, [orderId, clearCart]);

  return (
    <section className="max-w-2xl mx-auto px-6 py-14">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Checkout Status</h1>
        <p
          className={`mb-6 ${
            state === "ok" ? "text-green-700" : state === "error" ? "text-red-600" : "text-gray-700"
          }`}
        >
          {message}
        </p>

        {state === "ok" && (
          <Link href="/" className="btn-danger inline-block">
            Back to Shop
          </Link>
        )}

        {state === "error" && (
          <Link href="/checkout" className="btn-danger inline-block">
            Back to Checkout
          </Link>
        )}
      </div>
    </section>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <Suspense fallback={<div className="max-w-2xl mx-auto px-6 py-14"><p className="text-gray-600">Loading...</p></div>}>
        <CheckoutSuccessContent />
      </Suspense>
    </main>
  );
}
