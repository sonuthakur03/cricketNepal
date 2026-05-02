// src/utils/helpers.js

/** Format price in Nepali Rupees */
export const formatPrice = (amount) =>
  new Intl.NumberFormat('ne-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 })
    .format(amount)
    .replace('NPR', 'NPR ')

/** Format date in Nepal locale */
export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' })

/** Truncate text to maxLen with ellipsis */
export const truncate = (text, maxLen = 80) =>
  text?.length > maxLen ? text.slice(0, maxLen) + '…' : text

/** Extract error message from Axios error */
export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong'

/** Generate star array for rating display */
export const getStars = (rating, max = 5) =>
  Array.from({ length: max }, (_, i) => ({
    filled: i < Math.floor(rating),
    half: i === Math.floor(rating) && rating % 1 >= 0.5,
    empty: i >= Math.ceil(rating),
  }))

/** Get order status badge config */
export const getOrderStatusConfig = (status) => {
  const configs = {
    pending:    { label: 'Pending',     color: 'badge-gold' },
    confirmed:  { label: 'Confirmed',   color: 'badge-green' },
    processing: { label: 'Processing',  color: 'badge-green' },
    shipped:    { label: 'Shipped',     color: 'badge-green' },
    delivered:  { label: 'Delivered',   color: 'badge-green' },
    cancelled:  { label: 'Cancelled',   color: 'badge-red' },
    refunded:   { label: 'Refunded',    color: 'badge-gray' },
  }
  return configs[status] || { label: status, color: 'badge-gray' }
}

/** Scroll to top smoothly */
export const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

/** Nepal provinces */
export const NEPAL_PROVINCES = [
  'Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim',
]

/** Nepal major cities */
export const NEPAL_CITIES = [
  'Kathmandu', 'Pokhara', 'Lalitpur', 'Bhaktapur', 'Biratnagar', 'Birgunj',
  'Dharan', 'Butwal', 'Nepalgunj', 'Dhangadhi', 'Hetauda', 'Janakpur',
]

/** Product categories */
export const PRODUCT_CATEGORIES = [
  'Bats', 'Balls', 'Gloves', 'Pads', 'Helmets',
  'Jerseys', 'Shoes', 'Bags', 'Accessories', 'Training Equipment',
]
