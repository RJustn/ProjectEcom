"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import Link from "next/link";
import NavAuthStatus from "./NavAuthStatus";

export default function Header() {
  return (
    <header className="bg-white h-16 px-4 border-b border-gray-100">
      <div className="w-full h-full flex items-center justify-between">
        <Link
          href="/"
          className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center hover:opacity-90 transition"
          aria-label="Go to homepage"
          title="Home"
        >
          <span className="text-white font-bold text-base">VH</span>
        </Link>

        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton />
            <SignUpButton>
              <button className="bg-green-700 text-white rounded-full px-5 h-10">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <NavAuthStatus />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}