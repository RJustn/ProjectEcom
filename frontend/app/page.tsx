// app/page.tsx

import Link from "next/link";
import Header from "./components/Header";
import FeaturedProductsCarousel from "./components/FeaturedProductsCarousel";
import { formatPrice } from "./utils/formatPrice";
import { apiUrl } from "./utils/api";

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  category?: string;
}

export default async function HomePage() {
  // fetch products from backend (admin-created products)
  let products: Product[] = [];
  try {
    const res = await fetch(apiUrl("/products"));
    if (res.ok) products = await res.json();
  } catch (e) {
    console.error("Failed to load products", e);
  }

  const featuredProduct =
    products.find((product) => (product.stock ?? 0) > 0) || products[0] || null;

  return (
    <main className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative w-full min-h-[560px] flex items-center">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{
            backgroundImage:
              "url(/pngtree-textured-pattern-of-fresh-fruits-and-vegetables-image_13904266.png)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-green-950/85 via-green-900/70 to-emerald-700/45" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-20">
          <div className="max-w-3xl text-white">
            <p className="uppercase tracking-[0.2em] text-sm text-green-100 mb-4">
              Trusted Wellness Marketplace
            </p>
            <h1 className="text-4xl md:text-6xl font-semibold leading-tight mb-6">
              Vitamins and Health Essentials for Everyday Wellness
            </h1>
            <p className="text-lg md:text-xl text-green-100/95 leading-relaxed mb-8 max-w-2xl">
              Discover quality vitamins, supplements, and wellness essentials with transparent pricing, secure checkout, and reliable delivery.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#featured-products"
                className="bg-white text-green-800 px-7 py-3 rounded-lg font-semibold hover:bg-green-50 transition"
              >
                Shop Now
              </a>
              <Link
                href="/products"
                className="border border-white/80 text-white px-7 py-3 rounded-lg font-semibold hover:bg-white/15 transition"
              >
                Browse Catalog
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Highlights */}
      <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="hover-float bg-white/95 backdrop-blur rounded-xl border p-5 shadow-sm">
            <p className="text-sm font-semibold text-green-700 mb-1">Quality Assured</p>
            <p className="text-gray-600">Every vitamin and supplement is selected for safety, consistency, and trusted sourcing.</p>
          </div>
          <div className="hover-float bg-white/95 backdrop-blur rounded-xl border p-5 shadow-sm">
            <p className="text-sm font-semibold text-green-700 mb-1">Secure Checkout</p>
            <p className="text-gray-600">Simple and protected payment flow for every wellness purchase.</p>
          </div>
          <div className="hover-float bg-white/95 backdrop-blur rounded-xl border p-5 shadow-sm">
            <p className="text-sm font-semibold text-green-700 mb-1">Reliable Delivery</p>
            <p className="text-gray-600">Fast dispatch and transparent updates for your health essentials.</p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="featured-products" className="max-w-7xl mx-auto px-6 mt-5">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm uppercase tracking-widest text-green-700 font-semibold mb-2">Featured Selection</p>
            <h2 className="text-3xl font-semibold text-gray-900">Top Vitamins & Wellness Picks</h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-lg border border-green-200 bg-white px-4 py-2.5 text-green-700 font-semibold hover:bg-green-50 hover:border-green-300 transition"
          >
            View all products
            <span className="ml-2">→</span>
          </Link>
        </div>
      </section>
      <FeaturedProductsCarousel products={products} />

      {/* About Us */}
      <section id="about-us" className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div>
            <p className="text-sm uppercase tracking-widest text-green-700 font-semibold mb-3">About Us</p>
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">Built to make health support simple and dependable</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We support individuals and families with easy access to quality vitamins and wellness products. Our platform is designed for clear product information, smooth checkout, and reliable fulfillment from order to delivery.
            </p>
            <p className="text-gray-600 leading-relaxed">
              From ingredient transparency to customer support, we focus on consistency, trust, and long-term wellness.
            </p>
          </div>

          <div className="hover-float bg-white border rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">What we prioritize</h3>
            <ul className="space-y-3 text-gray-700">
              <li>• Quality vitamins and supplements from trusted partners</li>
              <li>• Clear ingredient and product information</li>
              <li>• Accurate pricing and straightforward checkout</li>
              <li>• Secure and protected payment processing</li>
              <li>• Responsive support when you need health product guidance</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Single Product Spotlight */}
      {featuredProduct && (
        <section className="max-w-7xl mx-auto px-6 py-14">
          <div className="hover-float rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="bg-gray-100">
                <img
                  src={featuredProduct.imageUrl || "/placeholder.png"}
                  alt={featuredProduct.name}
                  className="h-full min-h-[340px] w-full object-cover"
                />
              </div>

              <div className="p-8 md:p-10 flex flex-col justify-center">
                <p className="text-sm uppercase tracking-widest text-green-700 font-semibold mb-2">
                  Featured Product
                </p>
                <h2 className="text-3xl font-semibold text-gray-900 mb-3">{featuredProduct.name}</h2>

                {featuredProduct.category && (
                  <p className="text-sm text-gray-500 mb-4">Category: {featuredProduct.category}</p>
                )}

                <p className="text-gray-700 leading-relaxed mb-6">
                  {featuredProduct.description?.trim()
                    ? featuredProduct.description
                    : "A carefully selected wellness essential designed to support your daily health routine with dependable quality and value."}
                </p>

                <div className="flex items-center gap-6 mb-7">
                  <p className="text-3xl font-bold text-green-800">₱{formatPrice(featuredProduct.price)}</p>
                  <p className="text-sm font-medium text-gray-600">
                    {featuredProduct.stock > 0 ? `${featuredProduct.stock} in stock` : "Out of stock"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/products/${featuredProduct.id}`}
                    className="inline-flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    View Product
                  </Link>
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Browse More
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 pb-14">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-widest text-green-700 font-semibold mb-2">How It Works</p>
          <h2 className="text-3xl font-semibold text-gray-900">Shop wellness in three simple steps</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="hover-float bg-white border rounded-xl p-6 shadow-sm">
            <p className="text-sm font-semibold text-green-700 mb-2">Step 1</p>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose your vitamins</h3>
            <p className="text-gray-600">Browse health categories, compare formulas, and add essentials to your cart.</p>
          </div>
          <div className="hover-float bg-white border rounded-xl p-6 shadow-sm">
            <p className="text-sm font-semibold text-green-700 mb-2">Step 2</p>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Checkout securely</h3>
            <p className="text-gray-600">Complete your wellness purchase with a protected, straightforward payment flow.</p>
          </div>
          <div className="hover-float bg-white border rounded-xl p-6 shadow-sm">
            <p className="text-sm font-semibold text-green-700 mb-2">Step 3</p>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Track your delivery</h3>
            <p className="text-gray-600">Follow status updates from processing to doorstep delivery.</p>
          </div>
        </div>
      </section>

      {/* Service Commitments */}
      <section className="max-w-7xl mx-auto px-6 pb-10">
        <div className="hover-float bg-green-50 border border-green-100 rounded-2xl p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-widest text-green-700 font-semibold mb-2">Service Commitments</p>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Professional wellness service, every order</h3>
              <p className="text-gray-700 max-w-2xl">
                We continuously improve product verification, delivery coordination, and customer communication to provide a dependable health shopping experience.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center justify-center bg-green-600 text-white px-7 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Explore Products
            </Link>
          </div>
        </div>
      </section>
 

      {/* Bottom CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="hover-float bg-white/95 border rounded-2xl p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-sm">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Ready to support your daily wellness?</h3>
            <p className="text-gray-600">Explore our full catalog and add your vitamins and health essentials in minutes.</p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center justify-center bg-green-600 text-white px-7 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Start Shopping
          </Link>
        </div>
      </section>

    </main>
  );
}