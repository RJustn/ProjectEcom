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

interface Order {
  id: number;
  email: string | null;
  total: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [authChecked, setAuthChecked] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);

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

    const fetchOrders = async () => {
      try {
        const response = await fetch(apiUrl("/users/orders/all"));
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }
        const data = await response.json();
        setOrders(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [authChecked]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(
        apiUrl(`/users/orders/${orderId}/status`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleApproveCancel = async (orderId: number) => {
    if (!confirm('Are you sure you want to approve this cancellation? Stock will be restored and payment will be refunded.')) {
      return;
    }

    setCancellingOrderId(orderId);
    try {
      const response = await fetch(
        apiUrl(`/users/orders/${orderId}/cancel`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to cancel order");
      }

      // Update order with the status returned from backend (could be 'refunded' or 'cancelled')
      const finalStatus = data.status || "cancelled";
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: finalStatus } : o))
      );
      
      const successMsg = finalStatus === "refunded" 
        ? "Order cancelled and payment refunded successfully!" 
        : "Order cancelled. Stock restored but payment refund may be pending.";
      alert(successMsg);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (!authChecked) {
    return <p className="p-4">Checking authorization...</p>;
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Manage Customer Orders</h1>
        <p className="text-gray-600">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Manage Customer Orders</h1>
        <p className="text-gray-600">View all orders, check details, and update status</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">No orders found</p>
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
                    Total
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
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.email || "Guest"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₱{parseFloat(order.total as any).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingOrderId === order.id}
                        className={`px-3 py-1 rounded text-sm font-medium border ${
                          order.status === "paid"
                            ? "bg-green-50 border-green-200 text-green-700"
                            : order.status === "pending"
                            ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                            : order.status === "refunded"
                            ? "bg-red-50 border-red-200 text-red-700"
                            : order.status === "cancel_requested"
                            ? "bg-orange-50 border-orange-200 text-orange-700"
                            : "bg-gray-50 border-gray-200 text-gray-700"
                        } ${updatingOrderId === order.id ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancel_requested">Cancel Requested</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {order.status === "cancel_requested" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveCancel(order.id)}
                            disabled={cancellingOrderId === order.id}
                            className="px-3 py-1 rounded text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancellingOrderId === order.id ? "Processing..." : "Approve Cancel"}
                          </button>
                          <button
                            onClick={() =>
                              setExpandedOrderId(
                                expandedOrderId === order.id ? null : order.id
                              )
                            }
                            className="text-blue-600 hover:text-blue-700 font-medium transition"
                          >
                            {expandedOrderId === order.id ? "Hide" : "View"}
                          </button>
                        </div>
                      )}
                      {order.status !== "cancel_requested" && (
                        <>
                          <button
                            onClick={() =>
                              setExpandedOrderId(
                                expandedOrderId === order.id ? null : order.id
                              )
                            }
                            className="text-blue-600 hover:text-blue-700 font-medium transition"
                          >
                            {expandedOrderId === order.id ? "Hide" : "View"} Details
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Order Details Expansion */}
          {expandedOrderId && (
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
              {orders
                .filter((o) => o.id === expandedOrderId)
                .map((order) => (
                  <div key={order.id}>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Order #{order.id} Items
                    </h3>
                    <div className="space-y-3">
                      {order.items.map((item) => (
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
                              ₱{parseFloat(item.price as any).toFixed(2)} each
                            </p>
                            <p className="text-sm text-gray-600">
                              Subtotal: ₱
                              {(parseFloat(item.price as any) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Summary */}
                    <div className="mt-4 p-4 bg-white rounded border border-gray-200">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">
                            ₱{parseFloat(order.total as any).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span
                            className={`font-medium uppercase text-sm ${
                              order.status === "paid"
                                ? "text-green-600"
                                : order.status === "pending"
                                ? "text-yellow-600"
                                : "text-gray-600"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        {order.paidAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Paid On:</span>
                            <span className="font-medium">
                              {new Date(order.paidAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        )}
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
