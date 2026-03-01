"use client";

import React, { useEffect, useState } from 'react';
import { apiUrl } from '../../utils/api';

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  emailAddresses?: { emailAddress: string }[];
  createdAt: string;
}

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product?: { id: number; title?: string };
}

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  items?: OrderItem[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordersByUser, setOrdersByUser] = useState<Record<string, Order[]>>({});
  const [loadingByUser, setLoadingByUser] = useState<Record<string, boolean>>({});
  const [deletingByUser, setDeletingByUser] = useState<Record<string, boolean>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const usersPerPage = 10;
  const totalPages = Math.ceil(users.length / usersPerPage);
  const startIdx = (currentPage - 1) * usersPerPage;
  const endIdx = startIdx + usersPerPage;
  const paginatedUsers = users.slice(startIdx, endIdx);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiUrl('/users/clerk'));
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();
        console.log('clerk users response', data);
        // ensure we end up with an array (backend may wrap results)
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data && Array.isArray((data as any).users)) {
          setUsers((data as any).users);
        } else if (data && Array.isArray((data as any).data)) {
          setUsers((data as any).data);
        } else {
          // preserve payload in error to render it below
          const err = new Error('unexpected users payload');
          (err as any).payload = data;
          throw err;
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p>Loading users...</p>;
  if (error) {
    let payloadDisplay = null;
    try {
      const parsed = JSON.parse(error || '');
      payloadDisplay = <pre className="mt-2 bg-gray-100 p-2">{JSON.stringify(parsed, null, 2)}</pre>;
    } catch {
      // not JSON
    }
    return (
      <div>
        <p className="text-red-600">Error: {error}</p>
        {payloadDisplay}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Registered Users</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Created</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((u) => (
              <React.Fragment key={u.id}>
                <tr className="hover:bg-gray-100">
                  <td className="px-4 py-2 border text-sm">{u.id}</td>
                  <td className="px-4 py-2 border text-sm">
                    {u.emailAddresses?.[0]?.emailAddress ?? '—'}
                  </td>
                  <td className="px-4 py-2 border text-sm">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-4 py-2 border text-sm">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 border text-sm">
                    <div className="flex gap-2">
                      <button
                        className="px-2 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-60"
                        disabled={!!loadingByUser[u.id]}
                        onClick={async () => {
                          const email = u.emailAddresses?.[0]?.emailAddress;
                          if (!email) return;
                          setLoadingByUser((s) => ({ ...s, [u.id]: true }));
                          try {
                            const res = await fetch(apiUrl(`/users/orders?email=${encodeURIComponent(email)}`));
                            const payload = await res.json();
                            const list = Array.isArray(payload) ? payload : payload.data || [];
                            setOrdersByUser((s) => ({ ...s, [u.id]: list }));
                            setSelectedUserId(u.id);
                          } catch (e) {
                            console.error(e);
                            setOrdersByUser((s) => ({ ...s, [u.id]: [] }));
                            setSelectedUserId(u.id);
                          } finally {
                            setLoadingByUser((s) => ({ ...s, [u.id]: false }));
                          }
                        }}
                      >
                        {loadingByUser[u.id] ? 'Loading…' : 'View Orders'}
                      </button>
                      <button
                        className="btn-danger"
                        disabled={!!deletingByUser[u.id]}
                        onClick={async () => {
                          if (!confirm('Delete this user from Clerk? This cannot be undone.')) return;
                          setDeletingByUser((s) => ({ ...s, [u.id]: true }));
                          try {
                            const res = await fetch(apiUrl(`/users/clerk/${u.id}`), { method: 'DELETE' });
                            if (!res.ok) throw new Error('delete failed');
                            setUsers((s) => s.filter((x) => x.id !== u.id));
                            setOrdersByUser((s) => {
                              const copy = { ...s };
                              delete copy[u.id];
                              return copy;
                            });
                            if (selectedUserId === u.id) setSelectedUserId(null);
                          } catch (err) {
                            console.error(err);
                            alert('Failed to delete user');
                          } finally {
                            setDeletingByUser((s) => ({ ...s, [u.id]: false }));
                          }
                        }}
                      >
                        {deletingByUser[u.id] ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
                {selectedUserId === u.id && (
                  <tr>
                    <td colSpan={5} className="bg-gray-50 px-4 py-3">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-medium">Orders</h3>
                        <button
                          className="px-2 py-1 bg-gray-300 text-gray-800 rounded text-sm hover:bg-gray-400"
                          onClick={() => setSelectedUserId(null)}
                        >
                          Close
                        </button>
                      </div>
                      {loadingByUser[u.id] ? (
                        <p>Loading orders…</p>
                      ) : ordersByUser[u.id] && ordersByUser[u.id].length === 0 ? (
                        <p className="text-sm text-gray-600">No orders for this user.</p>
                      ) : ordersByUser[u.id] && ordersByUser[u.id].length > 0 ? (
                        <ul className="space-y-3">
                          {ordersByUser[u.id].map((o: Order) => (
                            <li key={o.id} className="p-2 border rounded bg-white">
                              <div className="flex justify-between">
                                <div>Order #{o.id} — {o.status}</div>
                                <div>Total: ₱{o.total}</div>
                              </div>
                              <div className="mt-2">
                                <strong>Items:</strong>
                                <ul className="list-disc pl-6 mt-1">
                                  {o.items?.map((it: OrderItem) => (
                                    <li key={it.id}>{it.product?.title ?? 'product'} x{it.quantity} — ₱{it.price}</li>
                                  ))}
                                </ul>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-600">No orders loaded.</p>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {users.length > usersPerPage && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            className="px-3 py-1 bg-gray-300 text-gray-800 rounded disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-3 py-1 bg-gray-300 text-gray-800 rounded disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}