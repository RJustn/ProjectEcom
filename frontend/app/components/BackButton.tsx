"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  fallbackHref?: string;
  className?: string;
  children?: React.ReactNode;
};

export default function BackButton({
  fallbackHref = "/products",
  className,
  children,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={className ?? "px-3 py-1 bg-gray-200 rounded"}
    >
      {children ?? "Back"}
    </button>
  );
}
