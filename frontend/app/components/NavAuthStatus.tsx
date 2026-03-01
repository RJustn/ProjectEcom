'use client';


import { useAuth, useUser, useClerk } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function NavAuthStatus() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
const role = user?.publicMetadata?.role;

  if (!isSignedIn) {
    return null;
  }

  const handleLogout = async () => {
    await signOut();
  };

    // check admin role from Clerk metadata
  const isAdminFlag = user?.publicMetadata?.isAdmin;

  return (
    <div className="flex items-center gap-4">
      <UserButton />

      {/* Admin button (ONLY shows if admin) */}
      {isAdminFlag === "true" && (
        <button
          onClick={() => router.push("/admin")}
          title="Admin Panel"
          className="text-gray-700 hover:text-blue-600 transition text-xl"
        >
          <i className="bi bi-gear"></i>
        </button>
      )}

      {/* Cart button */}
      <button
        onClick={() => router.push("/checkout")}
        title="Cart"
        className="text-gray-700 hover:text-green-600 transition text-xl"
      >
        <i className="bi bi-cart3"></i>
      </button>

      {/* My Orders button */}
      <button
        onClick={() => router.push("/orders")}
        title="My Orders"
        className="text-gray-700 hover:text-green-600 transition text-xl"
      >
        <i className="bi bi-bag"></i>
      </button>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        title="Logout"
        className="text-gray-700 hover:text-red-600 transition text-xl"
      >
        <i className="bi bi-box-arrow-right"></i>
      </button>
    </div>
  );
}
