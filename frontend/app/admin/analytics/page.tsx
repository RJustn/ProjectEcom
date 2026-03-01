"use client";

import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "../../utils/api";

type Order = {
  id: number;
  total: number | string;
  status: string;
  createdAt: string;
  paidAt?: string | null;
};

type MonthSales = {
  label: string;
  value: number;
};

const MONTH_COUNT = 6;

function getLastMonths(count: number) {
  const now = new Date();
  return Array.from({ length: count }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleString("en-PH", { month: "short" });
    return { key, label };
  });
}

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(apiUrl("/users/orders/all"), { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch analytics data");
        const payload = await res.json();
        setOrders(Array.isArray(payload?.data) ? payload.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const salesByMonth = useMemo<MonthSales[]>(() => {
    const months = getLastMonths(MONTH_COUNT);
    const totalsMap = new Map(months.map((month) => [month.key, 0]));

    orders.forEach((order) => {
      if (order.status !== "paid") return;
      const sourceDate = order.paidAt || order.createdAt;
      if (!sourceDate) return;

      const parsed = new Date(sourceDate);
      if (Number.isNaN(parsed.getTime())) return;

      const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
      if (totalsMap.has(key)) {
        totalsMap.set(key, (totalsMap.get(key) || 0) + Number(order.total || 0));
      }
    });

    return months.map((month) => ({ label: month.label, value: totalsMap.get(month.key) || 0 }));
  }, [orders]);

  const orderStatusCounts = useMemo(() => {
    const statusLabels: Record<string, string> = {
      paid: "Paid",
      pending: "Pending",
      shipped: "Shipped",
      delivered: "Delivered",
      cancel_requested: "Cancel Requested",
      cancelled: "Cancelled",
      refunded: "Refunded",
    };

    const counts: Record<string, number> = {};
    orders.forEach((order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({
        status,
        label: statusLabels[status] || status,
        count,
      }));
  }, [orders]);

  const maxSales = Math.max(...salesByMonth.map((item) => item.value), 0);
  const maxStatusCount = Math.max(...orderStatusCounts.map((item) => item.count), 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 2,
    }).format(value);

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics</h1>
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics</h1>
        <p className="text-gray-600">Track sales and order performance</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Sales Report</h2>
          <p className="text-sm text-gray-500 mb-5">Paid sales for the last 6 months</p>

          <div className="h-64 flex items-end gap-3">
            {salesByMonth.map((item) => {
              const height = maxSales > 0 ? Math.max((item.value / maxSales) * 100, 6) : 6;
              return (
                <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[11px] text-gray-500">{formatCurrency(item.value)}</span>
                  <div className="w-full rounded-t-md bg-blue-500" style={{ height: `${height}%` }} />
                  <span className="text-xs text-gray-600">{item.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Order Report</h2>
          <p className="text-sm text-gray-500 mb-5">Orders grouped by status</p>

          {orderStatusCounts.length === 0 ? (
            <p className="text-sm text-gray-500">No order data available.</p>
          ) : (
            <div className="space-y-3">
              {orderStatusCounts.map((item) => {
                const width = maxStatusCount > 0 ? (item.count / maxStatusCount) * 100 : 0;
                return (
                  <div key={item.status}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-gray-700">{item.label}</span>
                      <span className="font-medium text-gray-900">{item.count}</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-100">
                      <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
