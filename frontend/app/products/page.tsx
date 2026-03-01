"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import AddToCartButton from "../components/AddToCartButton";
import { formatPrice } from "../utils/formatPrice";
import { apiUrl } from "../utils/api";

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  imageUrl?: string;
  category?: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(apiUrl("/products"), { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setProducts(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const values = products
      .map((product) => (product.category || "").trim())
      .filter((category) => category.length > 0);
    return Array.from(new Set(values));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" ||
        (product.category || "").toLowerCase() === selectedCategory.toLowerCase();

      const matchesSearch =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        (product.description || "").toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
            <p className="text-gray-600 mt-2">Browse our complete product catalog</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-green-200 bg-white px-4 py-2.5 text-green-700 font-semibold hover:bg-green-50 hover:border-green-300 transition"
          >
            <span className="mr-2">←</span>
            Back to Home
          </Link>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search products..."
            className="w-full md:max-w-md px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCategoryFilter((prev) => !prev)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Category: {selectedCategory === "all" ? "All Categories" : selectedCategory}
            </button>

            {showCategoryFilter && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow z-10">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setShowCategoryFilter(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                    selectedCategory === "all" ? "text-green-700 font-medium" : "text-gray-700"
                  }`}
                >
                  All Categories
                </button>

                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowCategoryFilter(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                      selectedCategory.toLowerCase() === category.toLowerCase()
                        ? "text-green-700 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">No products match your search or filter.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedProducts.map((product) => (
                <article
                  key={product.id}
                  className="bg-white rounded-xl border shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  <Link href={`/products/${product.id}`} className="block">
                    <img
                      src={product.imageUrl ?? "/placeholder.png"}
                      alt={product.name}
                      className="h-60 w-full object-cover cursor-pointer"
                    />
                  </Link>

                  <div className="p-3">
                    <h2 className="font-semibold text-lg text-gray-900 mb-1 truncate">
                      {product.name}
                    </h2>
                    <p className="text-green-800 font-bold text-xl mb-2">
                      ₱{formatPrice(Number(product.price))}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Stock: {product.stock ?? 0} units
                    </p>

                    {product.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="w-full">
                      <AddToCartButton
                        id={product.id}
                        name={product.name}
                        price={product.price}
                        stock={product.stock ?? 0}
                        imageUrl={product.imageUrl}
                        variant="card"
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-green-700 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <i className="bi bi-chevron-left"></i> Previous
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`px-4 py-2 rounded-lg transition ${
                        currentPage === idx + 1
                          ? "bg-green-700 text-white"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-green-700 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
