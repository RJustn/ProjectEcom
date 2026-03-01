'use client';

import { useAuth, useUser } from '@clerk/nextjs';

export default function AuthStatus() {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();

  return (
    <div className="p-6 bg-blue-50 rounded-lg border border-blue-200 mb-6">
      {isSignedIn ? (
        <div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Welcome!</h2>
          <p className="text-gray-700">
            <strong>Status:</strong> Signed in
          </p>
          <p className="text-gray-700">
            <strong>User ID:</strong> {userId}
          </p>
          {user && (
            <>
              <p className="text-gray-700">
                <strong>Email:</strong> {user.emailAddresses?.[0]?.emailAddress}
              </p>
              <p className="text-gray-700">
                <strong>Name:</strong> {user.firstName} {user.lastName}
              </p>
            </>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Not Signed In</h2>
          <p className="text-gray-700">
            Sign in to access your account and view your orders.
          </p>
        </div>
      )}
    </div>
  );
}
