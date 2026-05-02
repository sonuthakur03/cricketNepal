// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { formatPrice, formatDate, getOrderStatusConfig, getErrorMessage } from '../utils/helpers'
import { TableSkeleton, Pagination } from '../components/common/UI'

function StatCard({ label, value, icon, sub }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-muted)] mb-1">{label}</p>
          <p className="text-2xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>{value}</p>
          {sub && <p className="text-xs text-primary-500 mt-0.5">{sub}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  )
}

const ADMIN_TABS = [
  { key: 'overview',  label: 'Overview',  icon: '📊' },
  { key: 'users',     label: 'Users',     icon: '👥' },
  { key: 'products',  label: 'Products',  icon: '📦' },
  { key: 'orders',    label: 'Orders',    icon: '🛒' },
  { key: 'sellers',   label: 'Sellers',   icon: '🏪' },
]

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchTab() }, [tab, page])

  const fetchTab = async () => {
    setLoading(true)
    try {
      if (tab === 'overview') {
        const { data } = await api.get('/admin/stats')
        setStats(data.data)
      } else if (tab === 'users') {
        const { data } = await api.get(`/admin/users?page=${page}&limit=15&search=${search}`)
        setUsers(data.data); setTotalPages(data.totalPages)
      } else if (tab === 'products') {
        const { data } = await api.get(`/admin/products?page=${page}&limit=15&search=${search}`)
        setProducts(data.data); setTotalPages(data.totalPages)
      } else if (tab === 'orders') {
        const { data } = await api.get(`/orders/admin?page=${page}&limit=15`)
        setOrders(data.data); setTotalPages(data.totalPages)
      } else if (tab === 'sellers') {
        const { data } = await api.get('/admin/users?role=seller&page=1&limit=50')
        setSellers(data.data)
      }
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setLoading(false) }
  }

  const handleToggleUser = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}`, { isActive: !currentStatus })
      toast.success('User updated')
      fetchTab()
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}"? This action cannot be undone.`)) return
    try {
      await api.delete(`/admin/users/${userId}`)
      toast.success('User deleted')
      fetchTab()
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  const handleApproveSeller = async (sellerId, approve) => {
    try {
      await api.put(`/admin/sellers/${sellerId}/approve`, { isApproved: approve })
      toast.success(`Seller ${approve ? 'approved' : 'rejected'}`)
      fetchTab()
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  const handleToggleFeatured = async (productId) => {
    try {
      await api.put(`/admin/products/${productId}/featured`)
      toast.success('Featured status toggled')
      fetchTab()
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  const handleOrderStatus = async (orderId, orderStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { orderStatus })
      toast.success('Order status updated')
      fetchTab()
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  return (
    <div className="page-container pt-24 py-12 min-h-screen">
      <h1 className="text-3xl font-black mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 overflow-x-auto border-b border-[var(--color-border)] pb-0">
        {ADMIN_TABS.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1) }}
            className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap -mb-px border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`} style={{ fontFamily: 'Syne, sans-serif' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? <TableSkeleton rows={8} /> : (
        <>
          {/* ── Overview ── */}
          {tab === 'overview' && stats && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Users"    value={stats.totalUsers}    icon="👥" />
                <StatCard label="Total Sellers"  value={stats.totalSellers}  icon="🏪" />
                <StatCard label="Total Products" value={stats.totalProducts} icon="📦" />
                <StatCard label="Total Revenue"  value={formatPrice(stats.totalRevenue || 0)} icon="💰" />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="card p-5">
                  <h2 className="font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>Recent Orders</h2>
                  <div className="space-y-3">
                    {stats.recentOrders?.map((o) => {
                      const { label, color } = getOrderStatusConfig(o.orderStatus)
                      return (
                        <div key={o._id} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-semibold font-mono text-xs">#{o._id.slice(-8).toUpperCase()}</p>
                            <p className="text-[var(--color-text-muted)] text-xs">{o.user?.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary-600">{formatPrice(o.totalPrice)}</p>
                            <span className={`${color} text-xs`}>{label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Top Products */}
                <div className="card p-5">
                  <h2 className="font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>Top Products</h2>
                  <div className="space-y-3">
                    {stats.topProducts?.map((p) => (
                      <div key={p._id} className="flex items-center gap-3 text-sm">
                        <img src={p.images?.[0]?.url} alt={p.name}
                          className="w-9 h-9 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold line-clamp-1">{p.name}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">⭐ {p.rating?.toFixed(1)} · {p.numReviews} reviews</p>
                        </div>
                        <p className="font-bold text-primary-600 flex-shrink-0">{formatPrice(p.price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Users ── */}
          {tab === 'users' && (
            <>
              <div className="mb-4">
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search by name or email..."
                  className="input max-w-sm text-sm py-2.5"
                  onKeyDown={(e) => e.key === 'Enter' && fetchTab()}
                />
              </div>
              <div className="card overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-[var(--color-border)]">
                    <tr>
                      {['User', 'Email', 'Role', 'Joined', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <img src={u.avatar?.url} alt={u.name}
                              className="w-7 h-7 rounded-full object-cover bg-slate-200 flex-shrink-0" />
                            <span className="font-medium">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)]">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={u.role === 'admin' ? 'badge-red' : u.role === 'seller' ? 'badge-gold' : 'badge-green'}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)] text-xs">{formatDate(u.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className={u.isActive ? 'badge-green' : 'badge-red'}>
                            {u.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {u.role !== 'admin' && (
                              <>
                                <button onClick={() => handleToggleUser(u._id, u.isActive)}
                                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                                    u.isActive
                                      ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20'
                                      : 'text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20'
                                  }`}>
                                  {u.isActive ? 'Suspend' : 'Activate'}
                                </button>
                                <button onClick={() => handleDeleteUser(u._id, u.name)}
                                  className="text-xs px-2.5 py-1 rounded-lg font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 transition-colors">
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}

          {/* ── Products ── */}
          {tab === 'products' && (
            <>
              <div className="mb-4">
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search products..."
                  className="input max-w-sm text-sm py-2.5" />
              </div>
              <div className="card overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-[var(--color-border)]">
                    <tr>
                      {['Product', 'Seller', 'Category', 'Price', 'Stock', 'Featured', 'Actions'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {products.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <img src={p.images?.[0]?.url} alt={p.name}
                              className="w-9 h-9 rounded-lg object-cover bg-slate-100 flex-shrink-0" />
                            <span className="font-medium line-clamp-1 max-w-[180px]">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)] text-xs">{p.seller?.name}</td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)]">{p.category}</td>
                        <td className="px-4 py-3 font-semibold text-primary-600">{formatPrice(p.price)}</td>
                        <td className="px-4 py-3">
                          <span className={p.stock > 0 ? 'badge-green' : 'badge-red'}>{p.stock}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleToggleFeatured(p._id)}
                            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                              p.isFeatured
                                ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                                : 'text-slate-500 bg-slate-100 dark:bg-slate-800'
                            }`}>
                            {p.isFeatured ? '⭐ Featured' : 'Set Featured'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/products/${p._id}`}
                            className="text-xs px-2.5 py-1 rounded-lg font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 transition-colors">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}

          {/* ── Orders ── */}
          {tab === 'orders' && (
            <>
              <div className="card overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-[var(--color-border)]">
                    <tr>
                      {['Order ID', 'Customer', 'Date', 'Total', 'Payment', 'Status', 'Update Status'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {orders.map((o) => {
                      const { label, color } = getOrderStatusConfig(o.orderStatus)
                      return (
                        <tr key={o._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs">#{o._id.slice(-8).toUpperCase()}</td>
                          <td className="px-4 py-3">{o.user?.name}</td>
                          <td className="px-4 py-3 text-[var(--color-text-muted)] text-xs">{formatDate(o.createdAt)}</td>
                          <td className="px-4 py-3 font-semibold text-primary-600">{formatPrice(o.totalPrice)}</td>
                          <td className="px-4 py-3">
                            <span className={o.isPaid ? 'badge-green' : 'badge-gold'}>
                              {o.isPaid ? `✓ ${o.paymentMethod}` : `⏳ ${o.paymentMethod}`}
                            </span>
                          </td>
                          <td className="px-4 py-3"><span className={color}>{label}</span></td>
                          <td className="px-4 py-3">
                            <select
                              value={o.orderStatus}
                              onChange={(e) => handleOrderStatus(o._id, e.target.value)}
                              className="text-xs border border-[var(--color-border)] rounded-lg px-2 py-1 bg-[var(--color-bg)] focus:outline-none focus:ring-1 focus:ring-primary-500">
                              {['pending','confirmed','processing','shipped','delivered','cancelled'].map((s) => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}

          {/* ── Sellers ── */}
          {tab === 'sellers' && (
            <div className="card overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-[var(--color-border)]">
                  <tr>
                    {['Seller', 'Store Name', 'Email', 'Joined', 'Approved', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {sellers.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img src={s.avatar?.url} alt={s.name}
                            className="w-7 h-7 rounded-full object-cover bg-slate-200 flex-shrink-0" />
                          <span className="font-medium">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{s.sellerInfo?.storeName || '—'}</td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{s.email}</td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)] text-xs">{formatDate(s.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={s.sellerInfo?.isApproved ? 'badge-green' : 'badge-red'}>
                          {s.sellerInfo?.isApproved ? '✓ Approved' : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {s.sellerInfo?.isApproved ? (
                          <button onClick={() => handleApproveSeller(s._id, false)}
                            className="text-xs px-2.5 py-1 rounded-lg font-medium text-red-600 bg-red-50 dark:bg-red-900/20 transition-colors">
                            Revoke
                          </button>
                        ) : (
                          <button onClick={() => handleApproveSeller(s._id, true)}
                            className="text-xs px-2.5 py-1 rounded-lg font-medium text-green-600 bg-green-50 dark:bg-green-900/20 transition-colors">
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
