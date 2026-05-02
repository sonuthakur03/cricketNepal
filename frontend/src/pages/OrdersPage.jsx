// src/pages/OrdersPage.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { formatPrice, formatDate, getOrderStatusConfig } from '../utils/helpers'
import { Pagination, TableSkeleton, EmptyState } from '../components/common/UI'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    api.get(`/orders/my-orders?page=${page}&limit=8`)
      .then(({ data }) => { setOrders(data.data); setTotalPages(data.totalPages) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="page-container pt-24 py-12 min-h-screen">
      <h1 className="text-3xl font-black mb-8" style={{ fontFamily: 'Syne, sans-serif' }}>My Orders</h1>

      {loading ? <TableSkeleton rows={5} /> : orders.length === 0 ? (
        <EmptyState icon="📦" title="No orders yet"
          message="You haven't placed any orders. Start shopping!"
          action={<Link to="/products" className="btn-primary">Browse Products</Link>} />
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => {
              const { label, color } = getOrderStatusConfig(order.orderStatus)
              return (
                <div key={order._id} className="card p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="font-bold font-mono text-sm">#{order._id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={color}>{label}</span>
                      <span className="font-bold text-primary-600 dark:text-primary-400">{formatPrice(order.totalPrice)}</span>
                      <Link to={`/orders/${order._id}`} className="btn-ghost text-sm py-1.5">View Details →</Link>
                    </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {order.orderItems?.slice(0, 4).map((item) => (
                      <img key={item._id} src={item.image} alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 flex-shrink-0" />
                    ))}
                    {order.orderItems?.length > 4 && (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-semibold text-[var(--color-text-muted)]">
                        +{order.orderItems.length - 4}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    {order.paymentMethod.toUpperCase()} · {order.isPaid ? '✓ Paid' : '⏳ Unpaid'} · {order.orderItems?.length} item{order.orderItems?.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )
            })}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
