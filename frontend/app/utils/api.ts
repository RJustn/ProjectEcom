const rawApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://project-ecom-kappa.vercel.app";

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
