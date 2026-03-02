'use client';

import { useAuth } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import { apiUrl } from '../utils/api';

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    price: number;
  };
}

interface Order {
  id: number;
  email: string;
  total: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  items: OrderItem[];
}

export default function OrdersPage() {
  const { isLoaded: isAuthLoaded, isSignedIn, sessionClaims } = useAuth();
  const { isLoaded: isUserLoaded, user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 4;

  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const paginatedOrders = orders.slice(startIndex, startIndex + ordersPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [orders]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        let email: string | null = null;

        if (isSignedIn) {
          email =
            user?.primaryEmailAddress?.emailAddress ||
            user?.emailAddresses?.[0]?.emailAddress ||
            (sessionClaims?.email as string | undefined) ||
            null;
        } else {
          const storedEmail = localStorage.getItem('checkoutEmail');
          if (storedEmail) {
            email = storedEmail;
          }
        }

        if (!email) {
          setError('Please sign in or provide an email to view orders');
          setLoading(false);
          return;
        }

        setError(null);

        const response = await fetch(
          apiUrl(`/users/orders?email=${encodeURIComponent(email)}`)
        );

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        setOrders(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    if (!isAuthLoaded) {
      return;
    }

    if (isSignedIn && !isUserLoaded) {
      return;
    }

    if (loading) {
      fetchOrders();
    }
  }, [isAuthLoaded, isUserLoaded, isSignedIn, sessionClaims, user, loading]);

  const handleRequestCancel = async (orderId: number) => {
    if (!confirm('Are you sure you want to request cancellation for this order?')) {
      return;
    }

    setCancellingOrderId(orderId);
    try {
      const response = await fetch(
        apiUrl(`/users/orders/${orderId}/request-cancel`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to request cancellation');
      }

      // Update order status locally
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'cancel_requested' } : o
        )
      );
      alert('Cancellation request sent to admin');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to request cancellation');
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track your purchase history and order status</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">No orders found</p>
            <Link href="/" className="btn-danger inline-block">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {paginatedOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order ID</p>
                      <p className="font-semibold text-gray-900">#{order.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className={`font-semibold uppercase text-sm ${
                        order.status === 'paid'
                          ? 'text-green-600'
                          : order.status === 'pending'
                          ? 'text-yellow-600'
                          : 'text-gray-600'
                      }`}>
                        {order.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="font-semibold text-gray-900">₱{parseFloat(order.total as any).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-6 py-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Items</h3>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-900">₱{parseFloat(item.price as any).toFixed(2)}</p>
                          <p className="text-sm text-gray-600">
                            ₱{(parseFloat(item.price as any) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                  <div>
                    {order.paidAt && (
                      <p className="text-sm text-gray-600">
                        Paid on{' '}
                        {new Date(order.paidAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {order.status !== 'cancelled' && order.status !== 'cancel_requested' && order.status !== 'delivered' && order.status !== 'processing' && (
                      <button
                        onClick={() => handleRequestCancel(order.id)}
                        disabled={cancellingOrderId === order.id}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancellingOrderId === order.id ? 'Requesting...' : 'Request Cancel'}
                      </button>
                    )}
                    {order.status === 'cancel_requested' && (
                      <span className="text-sm font-medium text-orange-600">Cancellation Requested</span>
                    )}
                    {order.status === 'cancelled' && (
                      <span className="text-sm font-medium text-red-600">Cancelled</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {orders.length > ordersPerPage && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;
                  const isActive = currentPage === page;

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded border transition ${
                        isActive
                          ? 'border-red-600 bg-red-600 text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Back to Shopping */}
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-green-200 bg-white px-4 py-2.5 text-green-700 font-semibold hover:bg-green-50 hover:border-green-300 transition"
          >
            <span className="mr-2">←</span>
            Back to Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
