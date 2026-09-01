// src/pages/AdminDashboard.jsx — Luxury Admin Command Center with secure controls & dark/light styling

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  HiOutlineUsers,
  HiOutlineCube,
  HiOutlineShoppingBag,
  HiOutlineCurrencyDollar,
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineShieldCheck,
  HiOutlineBan,
  HiOutlineTrash,
  HiStar,
  HiOutlineEye,
} from 'react-icons/hi'
import api from '../utils/api'
import { formatPrice, formatDate, getOrderStatusConfig, getErrorMessage } from '../utils/helpers'
import { TableSkeleton, Pagination } from '../components/common/UI'

function StatCard({ label, value, icon, sub }) {
  return (
    <div className="card-glass p-5 rounded-2xl" style={{ border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
            {label}
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-mono)' }}>
            {value}
          </p>
          {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,162,39,0.15)', color: 'var(--gold-400)' }}>
          {icon}
        </div>
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
      toast.success('User status updated')
      fetchTab()
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Permanently delete account "${name}"? This action cannot be undone.`)) return
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
      toast.success('Featured status updated')
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
    <div className="page-container pt-24 py-12 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <span className="badge badge-gold text-xs font-bold uppercase tracking-wider mb-1">
            Master Operations
          </span>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            Admin Command Center
          </h1>
        </div>

        <Link
          to="/admin/products/new"
          className="btn-primary inline-flex items-center gap-2 py-2.5 px-5 text-xs font-bold self-start sm:self-auto"
        >
          <HiOutlinePlus className="w-4 h-4" /> Add New Equipment
        </Link>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {ADMIN_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1) }}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              tab === t.key
                ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/20'
                : 'hover:bg-white/5 text-muted hover:text-white'
            }`}
            style={{
              background: tab === t.key ? 'var(--gold-400)' : 'transparent',
              color: tab === t.key ? '#080808' : 'var(--text-secondary)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? <TableSkeleton rows={8} /> : (
        <>
          {/* ── Tab: Overview ── */}
          {tab === 'overview' && stats && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Users"    value={stats.totalUsers}    icon={<HiOutlineUsers className="w-5 h-5" />} />
                <StatCard label="Active Sellers" value={stats.totalSellers}  icon={<HiOutlineShieldCheck className="w-5 h-5" />} />
                <StatCard label="Equipment Items" value={stats.totalProducts} icon={<HiOutlineCube className="w-5 h-5" />} />
                <StatCard label="Gross Volume"  value={formatPrice(stats.totalRevenue || 0)} icon={<HiOutlineCurrencyDollar className="w-5 h-5" />} />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="card-glass p-6 rounded-2xl" style={{ border: '1px solid var(--border)' }}>
                  <h2 className="font-bold text-base mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                    Recent Orders
                  </h2>
                  <div className="space-y-3">
                    {stats.recentOrders?.map((o) => {
                      const { label, color } = getOrderStatusConfig(o.orderStatus)
                      return (
                        <div key={o._id} className="flex items-center justify-between text-xs p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                          <div>
                            <p className="font-bold font-mono text-[11px]" style={{ color: 'var(--gold-400)' }}>
                              #{o._id.slice(-8).toUpperCase()}
                            </p>
                            <p className="text-muted mt-0.5">{o.user?.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                              {formatPrice(o.totalPrice)}
                            </p>
                            <span className={`badge ${color} text-[10px] mt-1`}>{label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Top Equipment */}
                <div className="card-glass p-6 rounded-2xl" style={{ border: '1px solid var(--border)' }}>
                  <h2 className="font-bold text-base mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                    Top Performing Equipment
                  </h2>
                  <div className="space-y-3">
                    {stats.topProducts?.map((p) => (
                      <div key={p._id} className="flex items-center gap-3 text-xs p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                        <img
                          src={p.images?.[0]?.url || '/images/products/bat.jpg'}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          style={{ border: '1px solid var(--border-subtle)' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold line-clamp-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                            {p.name}
                          </p>
                          <p className="text-[11px] text-muted mt-0.5">⭐ {p.rating?.toFixed(1)} · {p.numReviews} reviews</p>
                        </div>
                        <p className="font-bold flex-shrink-0" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-mono)' }}>
                          {formatPrice(p.price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Users ── */}
          {tab === 'users' && (
            <>
              <div className="mb-4">
                <div className="relative max-w-sm">
                  <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                  <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                    placeholder="Search by player name or email..."
                    className="input pl-9 text-xs py-2.5"
                    onKeyDown={(e) => e.key === 'Enter' && fetchTab()}
                  />
                </div>
              </div>

              <div className="card-glass rounded-2xl overflow-hidden overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full text-xs min-w-[700px]">
                  <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <tr>
                      {['User', 'Email', 'Role', 'Joined', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-bold uppercase tracking-wider text-muted text-[10px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs" style={{ color: 'var(--gold-400)' }}>
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${u.role === 'admin' ? 'badge-red' : u.role === 'seller' ? 'badge-gold' : 'badge-green'} text-[10px]`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted">{formatDate(u.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'} text-[10px]`}>
                            {u.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {u.role !== 'admin' && (
                              <>
                                <button
                                  onClick={() => handleToggleUser(u._id, u.isActive)}
                                  className="text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-colors hover:bg-white/10"
                                  style={{ color: u.isActive ? '#f59e0b' : '#22c55e', border: '1px solid var(--border-subtle)' }}
                                >
                                  {u.isActive ? 'Suspend' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u._id, u.name)}
                                  className="text-[11px] px-2.5 py-1 rounded-lg font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                                  style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                                >
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

          {/* ── Tab: Products ── */}
          {tab === 'products' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="relative max-w-sm flex-1">
                  <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                  <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                    placeholder="Search equipment catalog..."
                    className="input pl-9 text-xs py-2.5"
                  />
                </div>
                <Link to="/admin/products/new" className="btn-primary text-xs py-2.5 px-4 inline-flex items-center gap-1">
                  <HiOutlinePlus className="w-4 h-4" /> New Equipment
                </Link>
              </div>

              <div className="card-glass rounded-2xl overflow-hidden overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full text-xs min-w-[700px]">
                  <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <tr>
                      {['Equipment', 'Seller', 'Category', 'Price', 'Stock', 'Featured', 'Actions'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-bold uppercase tracking-wider text-muted text-[10px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {products.map((p) => (
                      <tr key={p._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={p.images?.[0]?.url || '/images/products/bat.jpg'}
                              alt={p.name}
                              className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                              style={{ border: '1px solid var(--border-subtle)' }}
                            />
                            <span className="font-bold line-clamp-1 max-w-[180px]" style={{ color: 'var(--text-primary)' }}>
                              {p.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">{p.seller?.name}</td>
                        <td className="px-4 py-3 text-muted">{p.category}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-mono)' }}>
                          {formatPrice(p.price)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${p.stock > 0 ? 'badge-green' : 'badge-red'} text-[10px]`}>
                            {p.stock} in stock
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleFeatured(p._id)}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors"
                            style={{
                              background: p.isFeatured ? 'rgba(201,162,39,0.2)' : 'rgba(255,255,255,0.05)',
                              color: p.isFeatured ? 'var(--gold-300)' : 'var(--text-muted)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            {p.isFeatured ? '⭐ Featured' : 'Set Featured'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link
                              to={`/admin/products/edit/${p._id}`}
                              className="text-[11px] px-2.5 py-1 rounded-lg font-semibold text-gold-400 hover:bg-gold-500/10 transition-colors"
                              style={{ border: '1px solid var(--border)' }}
                            >
                              Edit
                            </Link>
                            <Link
                              to={`/products/${p.slug || p._id}`}
                              className="text-[11px] px-2.5 py-1 rounded-lg font-semibold text-muted hover:text-white transition-colors"
                              style={{ border: '1px solid var(--border-subtle)' }}
                            >
                              View
                            </Link>
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

          {/* ── Tab: Orders ── */}
          {tab === 'orders' && (
            <>
              <div className="card-glass rounded-2xl overflow-hidden overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full text-xs min-w-[800px]">
                  <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <tr>
                      {['Order ID', 'Customer', 'Date', 'Total', 'Payment', 'Status', 'Update Status'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-bold uppercase tracking-wider text-muted text-[10px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.map((o) => {
                      const { label, color } = getOrderStatusConfig(o.orderStatus)
                      return (
                        <tr key={o._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 font-mono font-bold" style={{ color: 'var(--gold-400)' }}>
                            #{o._id.slice(-8).toUpperCase()}
                          </td>
                          <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{o.user?.name}</td>
                          <td className="px-4 py-3 text-muted">{formatDate(o.createdAt)}</td>
                          <td className="px-4 py-3 font-bold" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-mono)' }}>
                            {formatPrice(o.totalPrice)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${o.isPaid ? 'badge-green' : 'badge-gold'} text-[10px] uppercase font-bold`}>
                              {o.isPaid ? `✓ ${o.paymentMethod}` : `⏳ ${o.paymentMethod}`}
                            </span>
                          </td>
                          <td className="px-4 py-3"><span className={`badge ${color} text-[10px]`}>{label}</span></td>
                          <td className="px-4 py-3">
                            <select
                              value={o.orderStatus}
                              onChange={(e) => handleOrderStatus(o._id, e.target.value)}
                              className="text-xs rounded-xl px-2.5 py-1 focus:outline-none"
                              style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-heading)',
                              }}
                            >
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

          {/* ── Tab: Sellers ── */}
          {tab === 'sellers' && (
            <div className="card-glass rounded-2xl overflow-hidden overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-xs min-w-[700px]">
                <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <tr>
                    {['Seller', 'Store Name', 'Email', 'Joined', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-bold uppercase tracking-wider text-muted text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sellers.map((s) => (
                    <tr key={s._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs" style={{ color: 'var(--gold-400)' }}>
                            {s.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{s.sellerInfo?.storeName || '—'}</td>
                      <td className="px-4 py-3 text-muted">{s.email}</td>
                      <td className="px-4 py-3 text-muted">{formatDate(s.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${s.sellerInfo?.isApproved ? 'badge-green' : 'badge-red'} text-[10px]`}>
                          {s.sellerInfo?.isApproved ? '✓ Verified Partner' : '⏳ Pending Approval'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {s.sellerInfo?.isApproved ? (
                          <button
                            onClick={() => handleApproveSeller(s._id, false)}
                            className="text-[11px] px-2.5 py-1 rounded-lg font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                            style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApproveSeller(s._id, true)}
                            className="btn-primary text-[11px] py-1 px-3"
                          >
                            Approve Partner
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
