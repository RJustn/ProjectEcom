"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { apiUrl } from "../../utils/api";

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
  };
}

interface Payment {
  id: number;
  email: string | null;
  total: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  paymentReference: string;
  items: OrderItem[];
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [authChecked, setAuthChecked] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPaymentId, setExpandedPaymentId] = useState<number | null>(null);
  const [verifyingPaymentId, setVerifyingPaymentId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    const isAdminFlag = user?.publicMetadata?.isAdmin;
    if (!(isAdminFlag === "true")) {
      router.push("/");
      return;
    }
    setAuthChecked(true);
  }, [isLoaded, isSignedIn, user, router]);

  useEffect(() => {
    if (!authChecked) return;

    const fetchPayments = async () => {
      try {
        const response = await fetch(apiUrl("/users/payments"));
        if (!response.ok) {
          throw new Error("Failed to fetch payments");
        }
        const data = await response.json();
        setPayments(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch payments");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [authChecked]);

  const handleVerifyPayment = async (paymentId: number, paymentReference: string) => {
    setVerifyingPaymentId(paymentId);
    try {
      // Call the real PayMongo verification endpoint
      const response = await fetch(
        apiUrl(`/users/payments/${paymentId}/verify`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to verify payment with PayMongo");
      }

      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status: "verified" } : p))
      );
      
      alert(
        `✓ Payment Verified!\n\n` +
        `Amount: ₱${data.amount.toFixed(2)}\n` +
        `Status: ${data.paymentStatus}\n` +
        `Reference: ${paymentReference}\n\n` +
        `Payment has been confirmed as legitimate with PayMongo.`
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to verify payment";
      alert(`⚠ Verification Failed:\n\n${errorMsg}\n\nPlease check the order status and try again in a moment.`);
    } finally {
      setVerifyingPaymentId(null);
    }
  };



  const filteredPayments = payments.filter((p) => {
    // Always filter out cancelled payments
    if (p.status === "cancelled") return false;
    
    if (filterStatus === "all") return true;
    if (filterStatus === "paid") return p.status === "paid" || p.status === "processing";
    return p.status === filterStatus;
  });

  const totalRevenue = filteredPayments.reduce(
    (sum, p) => sum + parseFloat(p.total as any),
    0
  );

  const paidCount = filteredPayments.filter((p) => p.status === "paid" || p.status === "processing").length;
  const verifiedCount = filteredPayments.filter((p) => p.status === "verified").length;
  const refundedCount = filteredPayments.filter((p) => p.status === "refunded").length;

  if (!authChecked) {
    return <p className="p-4">Checking authorization...</p>;
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Payment Management</h1>
        <p className="text-gray-600">Loading payments...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Payment Management</h1>
        <p className="text-gray-600">View payment status, transaction history, and verify payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Total Transactions</p>
          <p className="text-3xl font-bold text-gray-900">{filteredPayments.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600">₱{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Verified Payments</p>
          <p className="text-3xl font-bold text-blue-600">{verifiedCount} / {paidCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Refunded Orders</p>
          <p className="text-3xl font-bold text-red-600">{refundedCount}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Status
        </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Payments (Excluding Cancelled)</option>
          <option value="paid">Paid / Processing</option>
          <option value="verified">Verified</option>
        </select>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">No payments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Customer Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      #{payment.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {payment.email || "Guest"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₱{parseFloat(payment.total as any).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          payment.status === "verified"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : payment.status === "refunded"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : payment.status === "processing" || payment.status === "paid"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-gray-50 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {payment.status === "processing" ? "Processing (Paid)" : payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(payment.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() =>
                            setExpandedPaymentId(
                              expandedPaymentId === payment.id ? null : payment.id
                            )
                          }
                          className="text-blue-600 hover:text-blue-700 font-medium transition"
                        >
                          {expandedPaymentId === payment.id ? "Hide" : "View"}
                        </button>
                        {payment.status === "paid" || payment.status === "processing" ? (
                          <button
                            onClick={() =>
                              handleVerifyPayment(payment.id, payment.paymentReference)
                            }
                            disabled={verifyingPaymentId === payment.id}
                            className="px-3 py-1 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {verifyingPaymentId === payment.id
                              ? "Verifying..."
                              : "Verify"}
                          </button>
                        ) : null}

                        {payment.status === "verified" && (
                          <span className="text-xs text-green-600 font-medium">✓ Verified</span>
                        )}
                        {payment.status === "refunded" && (
                          <span className="text-xs text-red-600 font-medium">↩ Refunded</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Details Expansion */}
          {expandedPaymentId && (
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
              {filteredPayments
                .filter((p) => p.id === expandedPaymentId)
                .map((payment) => (
                  <div key={payment.id}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Payment Reference</p>
                        <p className="font-mono text-sm text-gray-900 break-all">
                          {payment.paymentReference}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Payment Date</p>
                        <p className="font-medium text-gray-900">
                          {payment.paidAt
                            ? new Date(payment.paidAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Not yet paid"}
                        </p>
                      </div>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-3">Transaction Items</h3>
                    <div className="space-y-3 mb-4">
                      {payment.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-3 bg-white rounded border border-gray-200"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.product.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              ₱{parseFloat(item.price as any).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Subtotal: ₱
                              {(parseFloat(item.price as any) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Transaction Summary */}
                    <div className="p-4 bg-white rounded border border-gray-200">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="font-bold text-lg text-gray-900">
                            ₱{parseFloat(payment.total as any).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Status:</span>
                          <span
                            className={`font-medium uppercase text-sm ${
                              payment.status === "verified"
                                ? "text-green-600"
                                : payment.status === "refunded"
                                ? "text-red-600"
                                : payment.status === "processing" || payment.status === "paid"
                                ? "text-blue-600"
                                : "text-gray-600"
                            }`}
                          >
                            {payment.status === "processing" ? "Processing (Paid)" : payment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <Link href="/admin" className="text-red-600 hover:text-red-700 font-medium">
          ← Back to Admin Dashboard
        </Link>
      </div>
    </div>
  );
}
