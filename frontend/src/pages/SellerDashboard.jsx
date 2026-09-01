// src/pages/SellerDashboard.jsx — Luxury dark gold seller portal with live order status management and normal clean fonts

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCube,
  HiOutlineShoppingCart,
  HiOutlineCurrencyRupee,
  HiOutlineClock,
  HiStar,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import api from "../utils/api";
import {
  formatPrice,
  formatDate,
  getOrderStatusConfig,
  getErrorMessage,
} from "../utils/helpers";
import { TableSkeleton, Pagination } from "../components/common/UI";

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pending Approval" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing & Packing" },
  { value: "shipped", label: "Shipped & In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function StatCard({ label, value, icon: Icon, badge }) {
  return (
    <div className="card-glass p-5 rounded-2xl relative overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,162,39,0.12)', border: '1px solid var(--border)' }}>
          <Icon className="w-5 h-5" style={{ color: 'var(--gold-400)' }} />
        </div>
        <span className="badge badge-gold text-[10px] font-bold uppercase">{badge}</span>
      </div>
      <p
        className="text-2xl font-bold"
        style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.04em', color: 'var(--text-primary)' }}
      >
        {value}
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>{label}</p>
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
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [page]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get("/products/seller/my-products");
      setProducts(data.data || []);
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
      setOrders(data.data || []);
      setRevenue(
        data.revenue || {
          totalRevenue: 0,
          paidRevenue: 0,
          pendingRevenue: 0,
          totalOrders: 0,
        },
      );
      setTotalPages(data.totalPages || 1);
    } catch {}
  };

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Delete ${productName}? This cannot be undone.`))
      return;
    setDeletingId(productId);
    try {
      await api.delete(`/products/${productId}`);
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { orderStatus: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const tabs = [
    { key: "products", label: "My Equipment Vault", count: products.length },
    { key: "orders", label: "Customer Orders & Status", count: orders.length },
  ];

  return (
    <div className="page-container pt-24 py-12 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <div className="section-label mb-2">Verified Seller Portal</div>
          <h1
            style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              lineHeight: '0.95',
            }}
          >
            Seller Control Vault
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
            Manage equipment inventory, update fulfillment status, and monitor earnings
          </p>
        </div>
        <Link to="/seller/products/new" className="btn-primary flex items-center gap-2 px-6 py-3 self-start sm:self-auto">
          <HiOutlinePlus className="w-4 h-4" /> Add Equipment
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Listed Items"
          value={products.length}
          icon={HiOutlineCube}
          badge="Live"
        />
        <StatCard
          label="Orders Received"
          value={revenue.totalOrders}
          icon={HiOutlineShoppingCart}
          badge="Sales"
        />
        <StatCard
          label="Total Gross Revenue"
          value={formatPrice(revenue.totalRevenue)}
          icon={HiOutlineCurrencyRupee}
          badge="Earnings"
        />
        <StatCard
          label="Pending Collection"
          value={formatPrice(revenue.pendingRevenue || 0)}
          icon={HiOutlineClock}
          badge="COD"
        />
      </div>

      {/* Revenue breakdown strip */}
      {(revenue.paidRevenue > 0 || revenue.pendingRevenue > 0) && (
        <div className="card-glass p-4 rounded-2xl mb-8 flex flex-wrap gap-6 items-center justify-between" style={{ border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
              Online Prepaid:
            </span>
            <span className="text-sm font-bold text-green-400" style={{ fontFamily: 'var(--font-mono)' }}>
              {formatPrice(revenue.paidRevenue || 0)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gold-400 inline-block" />
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
              Cash on Delivery Pending:
            </span>
            <span className="text-sm font-bold" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-mono)' }}>
              {formatPrice(revenue.pendingRevenue || 0)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
              Total Realized:
            </span>
            <span className="text-base font-bold" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-mono)' }}>
              {formatPrice(revenue.totalRevenue || 0)}
            </span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-5 py-3 text-sm font-semibold transition-all relative ${
              activeTab === t.key
                ? "text-gold-400"
                : "text-muted hover:text-white"
            }`}
            style={{
              color: activeTab === t.key ? 'var(--gold-400)' : 'var(--text-muted)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            <span>{t.label} ({t.count})</span>
            {activeTab === t.key && (
              <motion.div
                layoutId="sellerTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: 'linear-gradient(90deg, var(--gold-300), var(--gold-500))' }}
              />
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : (
        <>
          {activeTab === "products" && (
            <div className="card-glass rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <tr>
                      {[
                        "Equipment Item",
                        "Category",
                        "Price NPR",
                        "Stock Status",
                        "Customer Rating",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider"
                          style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-heading)' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {products.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-16"
                          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}
                        >
                          <div className="text-4xl mb-3">📦</div>
                          <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No equipment listed yet</p>
                          <Link
                            to="/seller/products/new"
                            className="btn-primary inline-flex mt-2"
                          >
                            Add your first product
                          </Link>
                        </td>
                      </tr>
                    ) : (
                      products.map((p) => (
                        <tr
                          key={p._id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.images?.[0]?.url || '/images/products/bat.jpg'}
                                alt={p.name}
                                className="w-12 h-12 rounded-xl object-cover"
                                style={{ background: '#111', border: '1px solid var(--border-subtle)' }}
                              />
                              <div>
                                <span className="font-semibold block max-w-xs truncate text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                                  {p.name}
                                </span>
                                <span className="text-xs uppercase" style={{ color: 'var(--gold-400)', letterSpacing: '0.05em' }}>
                                  {p.brand}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
                            {p.category}
                          </td>
                          <td className="px-5 py-4 font-bold" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-mono)' }}>
                            {formatPrice(p.discountPrice || p.price)}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`badge ${p.stock > 0 ? "badge-gold" : "badge-red"}`}
                            >
                              {p.stock > 0 ? `${p.stock} in stock` : "Sold Out"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <HiStar className="w-4 h-4 text-gold-400" style={{ color: 'var(--gold-400)' }} />
                              <span className="font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{p.rating?.toFixed(1) || '0.0'}</span>
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({p.numReviews})</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <Link
                                to={`/seller/products/edit/${p._id}`}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                style={{ color: 'var(--gold-400)' }}
                                title="Edit Product"
                              >
                                <HiOutlinePencil className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDelete(p._id, p.name)}
                                disabled={deletingId === p._id}
                                className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                title="Delete Product"
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
            </div>
          )}

          {activeTab === "orders" && (
            <>
              <div className="card-glass rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <tr>
                        {[
                          "Order Code",
                          "Customer",
                          "Items Ordered",
                          "Date Placed",
                          "Total NPR",
                          "Payment",
                          "Current Status",
                          "Update Status",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider"
                            style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-heading)' }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="text-center py-16"
                            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}
                          >
                            <div className="text-4xl mb-3">🛒</div>
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No customer orders yet</p>
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
                              className="hover:bg-white/5 transition-colors"
                            >
                              <td className="px-5 py-4 font-mono text-xs font-bold" style={{ color: 'var(--gold-400)' }}>
                                #{o._id.slice(-8).toUpperCase()}
                              </td>
                              <td className="px-5 py-4">
                                <span className="font-semibold block text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                                  {o.user?.name || "Customer"}
                                </span>
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  {o.user?.email}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <div className="text-xs space-y-1 max-w-[200px]" style={{ fontFamily: 'var(--font-heading)' }}>
                                  {o.orderItems?.map((item, idx) => (
                                    <div key={idx} className="truncate" style={{ color: 'var(--text-secondary)' }}>
                                      {item.quantity}x {item.name || item.product?.name}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
                                {formatDate(o.createdAt)}
                              </td>
                              <td className="px-5 py-4 font-bold" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-mono)' }}>
                                {formatPrice(o.totalPrice)}
                              </td>
                              <td className="px-5 py-4">
                                <span
                                  className={`badge ${o.isPaid ? "badge-green" : "badge-gold"}`}
                                >
                                  {o.isPaid ? "Paid Online" : "COD Pending"}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`badge ${color}`}>{label}</span>
                              </td>
                              <td className="px-5 py-4">
                                <select
                                  value={o.orderStatus}
                                  disabled={updatingOrderId === o._id}
                                  onChange={(e) => handleUpdateOrderStatus(o._id, e.target.value)}
                                  className="select py-1.5 px-2.5 text-xs rounded-xl"
                                  style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--gold-300)',
                                    fontFamily: 'var(--font-heading)',
                                  }}
                                >
                                  {ORDER_STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
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
