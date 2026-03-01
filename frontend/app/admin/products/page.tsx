"use client";

import { useEffect, useState } from "react";
import axios from 'axios';
import { API_BASE_URL } from '../../utils/api';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  category?: string;
}

export default function AdminProductsPage() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category: ""
  });
  const [currentPage, setCurrentPage] = useState(0);
  const productsPerPage = 6;
  const [imageFile, setImageFile] = useState<File | null>(null);
  const API_URL = API_BASE_URL;
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      String(p.id).includes(query) ||
      (p.category?.toLowerCase().includes(query) ?? false)
    );
  });

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/products`);
      setProducts(res.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (id: number) => {
    const formData = new FormData();

    if (imageFile) formData.append('image', imageFile);

    Object.entries(newProduct).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    await axios.put(`${API_URL}/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    fetchProducts();
  };

  const handleAddProduct = async () => {
    const formData = new FormData();
    if (imageFile) formData.append('image', imageFile);
    Object.entries(newProduct).forEach(([key, value]) => {
      formData.append(key, value as any);
    });

    await axios.post(`${API_URL}/products`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setNewProduct({});
    setImageFile(null);
    fetchProducts();
  };

  const handleDelete = async (id: number) => {
    await axios.delete(`${API_URL}/products/${id}`);
    fetchProducts();
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEditClick = (product: Product) => {
    setNewProduct({
      name: product.name,
      price: product.price,
      stock: product.stock,
      description: product.description,
      category: product.category,
    });
    setEditingId(product.id);
    setImageFile(null);
  };

  if (loading) return <p>Loading products...</p>;

  return (
    <>
      {/* Products Section with Pagination */}
      <h1 className="text-3xl font-bold text-gray-800">Manage Products</h1>
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Products</h2>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name, ID, or category"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredProducts
            .slice(currentPage * productsPerPage, (currentPage + 1) * productsPerPage)
            .map(p => (
              <div
                key={p.id}
                className="bg-white p-4 rounded shadow flex items-center justify-between border border-gray-300 "
              >
                <div className="flex items-start gap-4">
                  {p.imageUrl && (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800">{p.name}</h3>
                    {p.category && (
                      <p className="text-sm text-gray-500 mb-1">
                        Category: {p.category}
                      </p>
                    )}
                    <p className="text-gray-600">
                      ₱{p.price} &bull; {p.stock} in stock
                    </p>
                    <p className="text-gray-500 text-sm"> ID: {p.id}</p>
                  </div>
                </div>

                {editingId !== p.id && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleEditClick(p)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>

        {Math.ceil(filteredProducts.length / productsPerPage) > 1 && (
          <div className="mt-6 flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
              disabled={currentPage === 0}
              className={`px-4 py-2 rounded ${
                currentPage === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600 transition"
              }`}
            >
              Previous
            </button>

            <span className="font-medium">
              Page {currentPage + 1} of {Math.ceil(products.length / productsPerPage)}
            </span>

            <button
              onClick={() =>
                setCurrentPage(prev =>
                  Math.min(prev + 1, Math.ceil(products.length / productsPerPage) - 1)
                )
              }
              disabled={currentPage >= Math.ceil(products.length / productsPerPage) - 1}
              className={`px-4 py-2 rounded ${
                currentPage >= Math.ceil(products.length / productsPerPage) - 1
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600 transition"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* Add / Edit Product Form */}
      <section className="bg-white p-6 rounded shadow">
        <h3 className="text-xl font-semibold mb-4">
          {editingId ? `Editing Product ID ${editingId}` : "Add Product"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Name</label>
            <input
              placeholder="Enter Name"
              value={newProduct.name || ""}
              onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Price */}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Price</label>
            <input
              placeholder="Enter Price"
              type="number"
              value={newProduct.price || ""}
              onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Stock */}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Stock</label>
            <input
              placeholder="Enter Stock"
              type="number"
              value={newProduct.stock || ""}
              onChange={e => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Category</label>
            <input
              placeholder="Enter Category"
              value={newProduct.category || ""}
              onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col sm:col-span-2">
            <label className="mb-1 font-medium text-gray-700">Description</label>
            <input
              placeholder="Enter Description"
              value={newProduct.description || ""}
              onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* File Upload */}
          <div className="flex flex-col sm:col-span-2">
            <label className="mb-1 font-medium text-gray-700">File</label>
            <input
              type="file"
              onChange={e => e.target.files && setImageFile(e.target.files[0])}
              className=""
            />
            {imageFile && (
              <img
                src={URL.createObjectURL(imageFile)}
                alt="Preview"
                className="w-32 h-32 object-cover rounded shadow mt-2"
              />
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-4">
          {editingId ? (
            <>
              <button
                onClick={() => handleUpdateProduct(editingId)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
              >
                Update
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setNewProduct({ name: "", price: 0, stock: 0, description: "", category: "" });
                  setImageFile(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleAddProduct}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Add Product
            </button>
          )}
        </div>
      </section>
    </>
  );
}
