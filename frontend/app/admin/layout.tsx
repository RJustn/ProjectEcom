"use client";


import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

const adminNavLinks = [
  ["/admin", "Dashboard"],
  ["/admin/users", "Users"],
  ["/admin/products", "Products"],
  ["/admin/orders", "Orders"],
  ["/admin/payments", "Payments"],
  ["/admin/analytics", "Analytics"],
] as const;

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    const role = user?.publicMetadata?.role;
    const isAdminFlag = user?.publicMetadata?.isAdmin;
    if (!(role === "admin" || isAdminFlag === true || isAdminFlag === "true")) {
      router.push("/");
      return;
    }
    setAuthChecked(true);
  }, [isLoaded, isSignedIn, user, router]);

  if (!authChecked) return <p>Checking authorization...</p>;

  return (
    <div className="min-h-screen bg-gray-100 lg:flex">
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r lg:min-h-screen">
        <div className="p-6 lg:sticky lg:top-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Panel</h2>

          <nav className="space-y-1">
            {adminNavLinks.map(([href, label]) => {
              const active =
                href === "/admin"
                  ? pathname === href
                  : pathname === href || pathname.startsWith(`${href}/`);

              return (
                <Link
                  key={href}
                  href={href}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <SignOutButton>
              <button
                type="button"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
