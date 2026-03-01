"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { API_BASE_URL } from "../utils/api";

type AdminOrder = {
  id: number;
  total: number | string;
  status: string;
  createdAt?: string;
  paidAt?: string | null;
};

type DashboardStats = {
  totalSales: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  revenueToday: number;
  lowStockProducts: number;
};

export default function AdminHomePage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [authChecked, setAuthChecked] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    revenueToday: 0,
    lowStockProducts: 0,
  });

  const API_URL = API_BASE_URL;

  const isSameLocalDate = (value: string | undefined | null, date: Date) => {
    if (!value) return false;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return false;
    return (
      parsed.getFullYear() === date.getFullYear() &&
      parsed.getMonth() === date.getMonth() &&
      parsed.getDate() === date.getDate()
    );
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    const role = user?.publicMetadata?.role;
    const isAdminFlag = user?.publicMetadata?.isAdmin;
    const isAdmin =
      isAdminFlag === true ||
      isAdminFlag === "true" ||
      role === "admin";

    if (!isAdmin) {
      router.push("/");
      return;
    }
    setAuthChecked(true);
  }, [isLoaded, isSignedIn, user, router]);

  useEffect(() => {
    if (!authChecked) return;

    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError("");

        const [ordersRes, usersRes, productsRes] = await Promise.all([
          fetch(`${API_URL}/users/orders/all`, { cache: "no-store" }),
          fetch(`${API_URL}/users`, { cache: "no-store" }),
          fetch(`${API_URL}/products`, { cache: "no-store" }),
        ]);

        if (!ordersRes.ok || !usersRes.ok || !productsRes.ok) {
          throw new Error("Failed to load dashboard statistics");
        }

        const ordersPayload = await ordersRes.json();
        const usersPayload = await usersRes.json();
        const productsPayload = await productsRes.json();

        const orders: AdminOrder[] = Array.isArray(ordersPayload?.data) ? ordersPayload.data : [];
        const users = Array.isArray(usersPayload) ? usersPayload : [];
        const products = Array.isArray(productsPayload) ? productsPayload : [];

        const paidOrders = orders.filter((order) => order.status === "paid");
        const totalSales = paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

        const today = new Date();
        const revenueToday = paidOrders.reduce((sum, order) => {
          const sourceDate = order.paidAt || order.createdAt;
          return isSameLocalDate(sourceDate, today) ? sum + Number(order.total || 0) : sum;
        }, 0);

        const lowStockProducts = products.filter((product: { stock?: number }) => Number(product.stock || 0) <= 5)
          .length;

        setStats({
          totalSales,
          totalOrders: orders.length,
          totalUsers: users.length,
          totalProducts: products.length,
          revenueToday,
          lowStockProducts,
        });
      } catch (error) {
        console.error(error);
        setStatsError("Unable to load dashboard statistics right now.");
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [authChecked]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 2,
    }).format(value);

  if (!authChecked) return <p>Checking authorization...</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
      <h2 className="text-2xl font-semibold mb-4">Welcome to the Admin Dashboard</h2>
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Statistics</h3>
        {statsError && <p className="text-red-600 mb-3">{statsError}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500">Total Sales</p>
            <p className="text-2xl font-bold text-gray-900">
              {statsLoading ? "..." : formatCurrency(stats.totalSales)}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">
              {statsLoading ? "..." : stats.totalOrders}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">
              {statsLoading ? "..." : stats.totalUsers}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="text-2xl font-bold text-gray-900">
              {statsLoading ? "..." : stats.totalProducts}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500">Revenue Today</p>
            <p className="text-2xl font-bold text-gray-900">
              {statsLoading ? "..." : formatCurrency(stats.revenueToday)}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500">Low Stock Products</p>
            <p className="text-2xl font-bold text-gray-900">
              {statsLoading ? "..." : stats.lowStockProducts}
            </p>
          </div>
        </div>
      </section>
      <p className="mb-6">Use the sidebar links to navigate between sections.</p>
      <ul className="list-disc ml-6 space-y-2">
        <li>
          <Link href="/admin/products" className="text-blue-600 hover:underline">
            Manage Products
          </Link>
        </li>
        <li>
          <Link href="/admin/users" className="text-blue-600 hover:underline">
            View Users
          </Link>
        </li>
        <li>
          <Link href="/admin/orders" className="text-blue-600 hover:underline">
            See Orders
          </Link>
        </li>
        <li>
          <Link href="/admin/payments" className="text-blue-600 hover:underline">
            Payment Records
          </Link>
        </li>
        <li>
          <Link href="/admin/analytics" className="text-blue-600 hover:underline">
            Analytics
          </Link>
        </li>
                <li>
          <Link href="/" className="text-blue-600 hover:underline">
            Homepage
          </Link>
        </li>
      </ul>
    </div>
  );
}
