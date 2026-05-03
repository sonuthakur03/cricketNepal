// src/pages/SellerDashboard.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineChartBar,
} from "react-icons/hi";
import api from "../utils/api";
import {
  formatPrice,
  formatDate,
  getOrderStatusConfig,
  getErrorMessage,
} from "../utils/helpers";
import { TableSkeleton, Pagination } from "../components/common/UI";

function StatCard({ label, value, icon, color }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-2xl`}>{icon}</span>
        <span className={`text-xs font-semibold badge-green`}>{color}</span>
      </div>
      <p
        className="text-2xl font-black"
        style={{ fontFamily: "Syne, sans-serif" }}
      >
        {value}
      </p>
      <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{label}</p>
    </div>
  );
}

export default function SellerDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [revenue, setRevenue] = useState({ totalRevenue: 0, totalOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [page]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get("/products/seller/my-products");
      setProducts(data.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await api.get(
        `/orders/seller-orders?page=${page}&limit=10`,
      );
      setOrders(data.data);
      setRevenue(data.revenue || { totalRevenue: 0, totalOrders: 0 });
      setTotalPages(data.totalPages);
    } catch {}
  };

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Delete "${productName}"? This cannot be undone.`))
      return;
    setDeletingId(productId);
    try {
      await api.delete(`/products/${productId}`);
      toast.success("Product deleted");
      fetchProducts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const tabs = [
    { key: "products", label: "My Products", icon: "📦" },
    { key: "orders", label: "Orders", icon: "🛒" },
  ];

  return (
    <div className="page-container pt-24 py-12 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-3xl font-black"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Seller Dashboard
        </h1>
        <Link to="/seller/products/new" className="btn-primary">
          <HiOutlinePlus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Products"
          value={products.length}
          icon="📦"
          color="Active"
        />
        <StatCard
          label="Total Orders"
          value={revenue.totalOrders}
          icon="🛒"
          color="Orders"
        />
        <StatCard
          label="Total Revenue"
          value={formatPrice(revenue.totalRevenue)}
          icon="💰"
          color="Revenue"
        />
        <StatCard label="This Month" value="—" icon="📈" color="Growth" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[var(--color-border)]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2.5 text-sm font-semibold -mb-px border-b-2 transition-colors ${
              activeTab === t.key
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : (
        <>
          {activeTab === "products" && (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-[var(--color-border)]">
                  <tr>
                    {[
                      "Product",
                      "Category",
                      "Price",
                      "Stock",
                      "Rating",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-12 text-[var(--color-text-muted)]"
                      >
                        No products yet.{" "}
                        <Link
                          to="/seller/products/new"
                          className="text-primary-600 font-semibold"
                        >
                          Add your first product →
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr
                        key={p._id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.images?.[0]?.url}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                            />
                            <span className="font-semibold line-clamp-1 max-w-xs">
                              {p.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)]">
                          {p.category}
                        </td>
                        <td className="px-4 py-3 font-semibold text-primary-600">
                          {formatPrice(p.discountPrice || p.price)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              p.stock > 0 ? "badge-green" : "badge-red"
                            }
                          >
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          ⭐ {p.rating?.toFixed(1)} ({p.numReviews})
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link
                              to={`/seller/products/edit/${p._id}`}
                              className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 transition-colors"
                            >
                              <HiOutlinePencil className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(p._id, p.name)}
                              disabled={deletingId === p._id}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "orders" && (
            <>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-[var(--color-border)]">
                    <tr>
                      {[
                        "Order ID",
                        "Customer",
                        "Date",
                        "Total",
                        "Status",
                        "Payment",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {orders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-12 text-[var(--color-text-muted)]"
                        >
                          No orders yet
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => {
                        const { label, color } = getOrderStatusConfig(
                          o.orderStatus,
                        );
                        return (
                          <tr
                            key={o._id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="px-4 py-3 font-mono text-xs">
                              #{o._id.slice(-8).toUpperCase()}
                            </td>
                            <td className="px-4 py-3">{o.user?.name}</td>
                            <td className="px-4 py-3 text-[var(--color-text-muted)]">
                              {formatDate(o.createdAt)}
                            </td>
                            <td className="px-4 py-3 font-semibold text-primary-600">
                              {formatPrice(o.totalPrice)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={color}>{label}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={
                                  o.isPaid ? "badge-green" : "badge-gold"
                                }
                              >
                                {o.isPaid ? "Paid" : "Pending"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
