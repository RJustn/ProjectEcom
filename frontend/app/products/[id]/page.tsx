import Link from "next/link";
import AddToCartButton from "../../components/AddToCartButton";
import Header from "@/app/components/Header";
import BackButton from "../../components/BackButton";
import { formatPrice } from "../../utils/formatPrice";
import { apiUrl } from "../../utils/api";

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  imageUrl?: string;
  category?: string;
};

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product: Product | null = null;
  let allProducts: Product[] = [];

  try {
    const res = await fetch(apiUrl(`/products/${id}`));
    if (res.ok) product = await res.json();
  } catch (err) {
    console.error("Failed to fetch product", err);
  }

  try {
    const allRes = await fetch(apiUrl("/products"));
    if (allRes.ok) allProducts = await allRes.json();
  } catch (err) {
    console.error("Failed to fetch suggested products", err);
  }

  if (!product) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-red-600 text-xl mb-4">Product not found.</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-green-200 bg-white px-5 py-2.5 text-green-700 font-semibold hover:bg-green-50 transition"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const relatedByCategory = allProducts.filter(
    (item) =>
      item.id !== product.id &&
      (item.category || "").toLowerCase() === (product.category || "").toLowerCase(),
  );
  const otherProducts = allProducts.filter((item) => item.id !== product.id);
  const suggestedProducts = [...relatedByCategory, ...otherProducts]
    .filter((item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, 4);

  return (
    <main className="min-h-screen">
      <Header />

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm">
          <Link href="/" className="hover:text-green-700 transition font-medium">Home</Link>
          <span className="text-gray-400">/</span>
          <Link href="/products" className="hover:text-green-700 transition font-medium">Products</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-semibold truncate max-w-[220px]">{product.name}</span>
        </div>
      </div>

      {/* Product Detail Section */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Product Image */}
            <div className="relative bg-gray-50">
              <img
                src={product.imageUrl ?? '/placeholder.png'}
                alt={product.name}
                className="w-full h-full min-h-[500px] object-cover"
              />
            </div>

            {/* Product Details */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              {product.category && (
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full mb-4 w-fit">
                  {product.category}
                </span>
              )}
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
              
              <div className="text-4xl font-bold text-green-700 mb-6">
                ₱{formatPrice(product.price)}
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">Availability</p>
                <p className={`text-base font-semibold ${(product.stock ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(product.stock ?? 0) > 0 ? `${product.stock} units in stock` : 'Out of stock'}
                </p>
              </div>

              <div className="mb-8">
                <p className="text-sm font-semibold text-gray-900 mb-2">Description</p>
                <p className="text-gray-700 leading-relaxed">
                  {product.description ?? 'No description provided.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    
                  <AddToCartButton
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    stock={product.stock ?? 0}
                    imageUrl={product.imageUrl}
                  />
                </div>
                <BackButton className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold transition">
                  Back
                </BackButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Products */}
      {suggestedProducts.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-sm uppercase tracking-widest text-green-700 font-semibold mb-2">
                You May Also Like
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
                Suggested Products
              </h2>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-lg border border-green-200 bg-white px-4 py-2.5 text-green-700 font-semibold hover:bg-green-50 hover:border-green-300 transition"
            >
              View all products
              <span className="ml-2">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {suggestedProducts.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-xl border shadow-sm hover:shadow-md transition overflow-hidden"
              >
                <Link href={`/products/${item.id}`} className="block">
                  <img
                    src={item.imageUrl ?? "/placeholder.png"}
                    alt={item.name}
                    className="h-52 w-full object-cover"
                  />
                </Link>

                <div className="p-4">
                  {item.category && (
                    <p className="text-xs font-medium text-green-700 mb-2 uppercase tracking-wide">
                      {item.category}
                    </p>
                  )}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[48px]">
                    {item.name}
                  </h3>
                  <p className="text-green-800 font-bold text-lg mb-3">
                    ₱{formatPrice(item.price)}
                  </p>

                  <AddToCartButton
                    id={item.id}
                    name={item.name}
                    price={item.price}
                    stock={item.stock ?? 0}
                    imageUrl={item.imageUrl}
                    variant="card"
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
