"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";
import { formatPrice } from "../utils/formatPrice";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

interface Props {
  products: Product[];
}

export default function FeaturedProductsCarousel({ products }: Props) {
  const [randomProducts, setRandomProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");
  const [itemsPerPage, setItemsPerPage] = useState(4);

  // Randomize products on client-side only to avoid hydration mismatch
  useEffect(() => {
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    setRandomProducts(shuffled.slice(0, 6));
  }, [products]);

  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 640) {
        setItemsPerPage(1);
        return;
      }

      if (window.innerWidth < 1024) {
        setItemsPerPage(2);
        return;
      }

      setItemsPerPage(4);
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  // Get 4 visible products starting from currentIndex
  const visibleProducts = Array.from({ length: itemsPerPage }).map(
    (_, i) => randomProducts[(currentIndex + i) % randomProducts.length]
  ).filter(Boolean); // Filter out undefined values during initial render

  const goToPrevious = () => {
    if (isAnimating || randomProducts.length <= 1) return;
    setSlideDirection("prev");
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === 0 ? randomProducts.length - 1 : prev - 1));
  };

  const goToNext = () => {
    if (isAnimating || randomProducts.length <= 1) return;
    setSlideDirection("next");
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === randomProducts.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (!isAnimating) return;
    const timeout = setTimeout(() => setIsAnimating(false), 520);
    return () => clearTimeout(timeout);
  }, [currentIndex, isAnimating]);

  // Don't render until products are loaded on client
  if (randomProducts.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-72 w-full max-w-7xl bg-gray-100 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-6 px-4 py-12">
        {/* Left Arrow */}
        <button
          onClick={goToPrevious}
          disabled={isAnimating}
          className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full border-2 border-green-700 text-green-700 hover:bg-green-700 hover:text-white flex items-center justify-center transition-all disabled:opacity-50"
          aria-label="Previous products"
        >
          <i className="bi bi-chevron-left text-lg sm:text-2xl lg:text-3xl"></i>
        </button>

        {/* Products Grid - 4 items at a time */}
        <div className="flex-1 max-w-7xl overflow-hidden">
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 ${
              isAnimating
                ? slideDirection === "next"
                  ? "carousel-slide-next"
                  : "carousel-slide-prev"
                : ""
            }`}
          >
            {visibleProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
              >
                <Link href={`/products/${product.id}`} className="block">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-56 sm:h-64 lg:h-72 w-full object-cover cursor-pointer hover:opacity-95 transition"
                  />
                </Link>

                <div className="p-3 sm:p-4">
                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-2 truncate">
                    {product.name}
                  </h3>
                  <p className="text-green-800 font-bold text-lg sm:text-xl mb-4">
                    ₱{formatPrice(product.price)}
                  </p>

                  <div className="w-full">
                    <AddToCartButton
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      stock={product.stock}
                      imageUrl={product.imageUrl}
                      variant="card"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={goToNext}
          disabled={isAnimating}
          className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full border-2 border-green-700 text-green-700 hover:bg-green-700 hover:text-white flex items-center justify-center transition-all disabled:opacity-50"
          aria-label="Next products"
        >
          <i className="bi bi-chevron-right text-lg sm:text-2xl lg:text-3xl"></i>
        </button>
      </div>

    
    </div>
  );
}
