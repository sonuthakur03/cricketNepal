// src/pages/ProfilePage.jsx — Luxury profile management for users, sellers, and admins with robust validation

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineCamera,
  HiOutlineChartBar,
  HiOutlineShoppingCart,
  HiOutlineHeart,
  HiOutlineLocationMarker,
  HiOutlineExclamationCircle,
  HiCheck,
} from 'react-icons/hi'
import useAuthStore from '../context/authStore'
import { NEPAL_PROVINCES, NEPAL_CITIES, getErrorMessage } from '../utils/helpers'
import api from '../utils/api'
import {
  validateName,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
} from '../utils/validators'

export default function ProfilePage() {
  const { user, updateProfile, changePassword, fetchMe } = useAuthStore()
  const [tab, setTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      district: user?.address?.district || '',
      province: user?.address?.province || '',
    },
    sellerInfo: {
      storeName: user?.sellerInfo?.storeName || '',
      storeDescription: user?.sellerInfo?.storeDescription || '',
    },
  })

  const [profileErrors, setProfileErrors] = useState({})
  const [profileTouched, setProfileTouched] = useState({})

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwTouched, setPwTouched] = useState({})

  // Synchronize form when user object updates
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          district: user.address?.district || '',
          province: user.address?.province || '',
        },
        sellerInfo: {
          storeName: user.sellerInfo?.storeName || '',
          storeDescription: user.sellerInfo?.storeDescription || '',
        },
      })
    }
  }, [user])

  // Profile Field Validation
  const validateProfileField = (field, value) => {
    let err = ''
    if (field === 'name') {
      const res = validateName(value, 'Full Name', 2)
      if (!res.isValid) err = res.error
    } else if (field === 'phone') {
      const res = validatePhone(value, false) // optional if user has not set phone yet, but if entered must be valid
      if (!res.isValid) err = res.error
    } else if (field === 'storeName' && user?.role === 'seller') {
      if (value && value.trim().length < 2) {
        err = 'Store name must be at least 2 characters'
      }
    }
    setProfileErrors((prev) => ({ ...prev, [field]: err }))
    return !err
  }

  const handleProfileBlur = (field) => {
    setProfileTouched((prev) => ({ ...prev, [field]: true }))
    if (field === 'storeName') {
      validateProfileField(field, profileForm.sellerInfo.storeName)
    } else {
      validateProfileField(field, profileForm[field])
    }
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileTouched({ name: true, phone: true, storeName: true })

    const nameOk = validateProfileField('name', profileForm.name)
    const phoneOk = validateProfileField('phone', profileForm.phone)
    const storeOk = user?.role === 'seller' ? validateProfileField('storeName', profileForm.sellerInfo.storeName) : true

    if (!nameOk || !phoneOk || !storeOk) {
      toast.error('Please fix the errors before saving')
      return
    }

    setLoading(true)
    const result = await updateProfile(profileForm)
    if (result.success) {
      toast.success('Profile details saved successfully!')
      fetchMe()
    } else {
      toast.error(result.message)
    }
    setLoading(false)
  }

  // Password Field Validation
  const newPwStrength = validatePassword(pwForm.newPassword)

  const validatePwField = (field, value, currentPwState = pwForm) => {
    let err = ''
    if (field === 'currentPassword') {
      if (!value) err = 'Current password is required'
    } else if (field === 'newPassword') {
      const res = validatePassword(value)
      if (!res.isValid) err = res.error
      else if (currentPwState.currentPassword && value === currentPwState.currentPassword) {
        err = 'New password cannot be identical to current password'
      }
    } else if (field === 'confirmPassword') {
      const res = validateConfirmPassword(currentPwState.newPassword, value)
      if (!res.isValid) err = res.error
    }
    setPwErrors((prev) => ({ ...prev, [field]: err }))
    return !err
  }

  const handlePwBlur = (field) => {
    setPwTouched((prev) => ({ ...prev, [field]: true }))
    validatePwField(field, pwForm[field])
  }

  const handlePwChange = (field, value) => {
    const updated = { ...pwForm, [field]: value }
    setPwForm(updated)
    if (pwTouched[field] || pwErrors[field]) {
      validatePwField(field, value, updated)
    }
    if (field === 'newPassword' && pwTouched.confirmPassword) {
      validatePwField('confirmPassword', pwForm.confirmPassword, updated)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwTouched({ currentPassword: true, newPassword: true, confirmPassword: true })

    const currOk = validatePwField('currentPassword', pwForm.currentPassword)
    const newOk = validatePwField('newPassword', pwForm.newPassword)
    const confirmOk = validatePwField('confirmPassword', pwForm.confirmPassword)

    if (!currOk || !newOk || !confirmOk) {
      toast.error('Please fix all password errors')
      return
    }

    setLoading(true)
    const result = await changePassword(pwForm.currentPassword, pwForm.newPassword)
    if (result.success) {
      toast.success('Password updated successfully!')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPwErrors({})
      setPwTouched({})
    } else {
      toast.error(result.message)
    }
    setLoading(false)
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (JPG, PNG, WebP)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB')
      return
    }
    setAvatarLoading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      await api.put('/auth/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await fetchMe()
      toast.success('Profile picture updated!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setAvatarLoading(false)
    }
  }

  // Generate fallback initials
  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'PN'

  return (
    <div className="page-container pt-24 py-12 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="mb-8 pb-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="section-label mb-2">Account Center</div>
        <h1
          style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            lineHeight: '0.95',
          }}
        >
          My Profile & Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
          Manage your personal information, delivery addresses, and security
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Left Sidebar Profile Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card-glass p-6 text-center rounded-2xl relative overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {/* Avatar */}
            <div className="relative inline-block mb-4">
              {user?.avatar?.url ? (
                <img
                  src={user.avatar.url}
                  alt={user?.name}
                  className="w-24 h-24 rounded-2xl object-cover mx-auto"
                  style={{ border: '2px solid var(--gold-400)', boxShadow: '0 0 20px rgba(201,162,39,0.2)' }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto"
                  style={{
                    background: 'linear-gradient(135deg, rgba(201,162,39,0.2), rgba(201,162,39,0.05))',
                    border: '2px solid var(--gold-400)',
                    color: 'var(--gold-400)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {initials}
                </div>
              )}
              <label
                className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-110 shadow-lg"
                style={{ background: 'var(--gold-400)', color: '#080808' }}
                title="Change Avatar"
              >
                {avatarLoading ? (
                  <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                ) : (
                  <HiOutlineCamera className="w-4.5 h-4.5" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>

            <p className="font-bold text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              {user?.name || 'PitchNepal Player'}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
              {user?.email}
            </p>

            <div className="mt-3 flex justify-center">
              <span
                className={`badge capitalize font-bold text-xs ${
                  user?.role === 'admin'
                    ? 'badge-red'
                    : user?.role === 'seller'
                    ? 'badge-gold'
                    : 'badge-green'
                }`}
              >
                {user?.role === 'seller' ? '🏪 Verified Seller' : user?.role === 'admin' ? '👑 Administrator' : '🏏 Player / Buyer'}
              </span>
            </div>

            {/* Quick dashboard access based on role */}
            {user?.role === 'seller' && (
              <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <Link
                  to="/seller"
                  className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2"
                >
                  <HiOutlineChartBar className="w-4 h-4" /> Go to Seller Dashboard
                </Link>
              </div>
            )}

            {user?.role === 'admin' && (
              <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <Link
                  to="/admin"
                  className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2"
                >
                  <HiOutlineChartBar className="w-4 h-4" /> Go to Admin Dashboard
                </Link>
              </div>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="card-glass p-2 rounded-2xl space-y-1" style={{ border: '1px solid var(--border)' }}>
            {[
              { key: 'profile', label: 'Profile Information', icon: <HiOutlineUser className="w-4 h-4" /> },
              { key: 'security', label: 'Security & Password', icon: <HiOutlineLockClosed className="w-4 h-4" /> },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  tab === t.key ? 'bg-gold-400 text-black' : 'hover:bg-white/5'
                }`}
                style={{
                  color: tab === t.key ? '#080808' : 'var(--text-secondary)',
                  background: tab === t.key ? 'linear-gradient(135deg, var(--gold-300), var(--gold-400))' : 'transparent',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}

            <Link
              to="/orders"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}
            >
              <HiOutlineShoppingCart className="w-4 h-4" /> My Orders
            </Link>

            <Link
              to="/wishlist"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}
            >
              <HiOutlineHeart className="w-4 h-4" /> Saved Equipment
            </Link>
          </nav>
        </div>

        {/* Right Main Content */}
        <div className="lg:col-span-3">
          {tab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <form onSubmit={handleProfileSave} noValidate className="space-y-6">
                {/* Personal Information */}
                <div className="card-glass p-6 rounded-2xl space-y-4" style={{ border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <HiOutlineUser className="w-5 h-5 text-gold-400" style={{ color: 'var(--gold-400)' }} />
                    <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                      Personal Information
                    </h2>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Full Name *</label>
                      <input
                        value={profileForm.name}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, name: e.target.value })
                          if (profileTouched.name || profileErrors.name) {
                            validateProfileField('name', e.target.value)
                          }
                        }}
                        onBlur={() => handleProfileBlur('name')}
                        className={`input ${profileTouched.name && profileErrors.name ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                        placeholder="e.g. Rohit Paudel"
                      />
                      <AnimatePresence>
                        {profileTouched.name && profileErrors.name && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -4, height: 0 }}
                            className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400"
                          >
                            <HiOutlineExclamationCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{profileErrors.name}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div>
                      <label className="label">Phone Number</label>
                      <input
                        value={profileForm.phone}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, phone: e.target.value })
                          if (profileTouched.phone || profileErrors.phone) {
                            validateProfileField('phone', e.target.value)
                          }
                        }}
                        onBlur={() => handleProfileBlur('phone')}
                        placeholder="+977 98XXXXXXXX"
                        className={`input ${profileTouched.phone && profileErrors.phone ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                      />
                      <AnimatePresence>
                        {profileTouched.phone && profileErrors.phone && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -4, height: 0 }}
                            className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400"
                          >
                            <HiOutlineExclamationCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{profileErrors.phone}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="card-glass p-6 rounded-2xl space-y-4" style={{ border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <HiOutlineLocationMarker className="w-5 h-5 text-gold-400" style={{ color: 'var(--gold-400)' }} />
                    <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                      Primary Delivery Address
                    </h2>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Province</label>
                      <select
                        className="select"
                        value={profileForm.address.province}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            address: { ...profileForm.address, province: e.target.value },
                          })
                        }
                      >
                        <option value="">Select province</option>
                        {NEPAL_PROVINCES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label">City / Town</label>
                      <input
                        list="cities-profile"
                        className="input"
                        placeholder="e.g. Kathmandu, Pokhara"
                        value={profileForm.address.city}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            address: { ...profileForm.address, city: e.target.value },
                          })
                        }
                      />
                      <datalist id="cities-profile">
                        {NEPAL_CITIES.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="label">District</label>
                      <input
                        className="input"
                        placeholder="e.g. Kathmandu, Lalitpur"
                        value={profileForm.address.district}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            address: { ...profileForm.address, district: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="label">Street / Ward / Landmark</label>
                      <input
                        className="input"
                        placeholder="e.g. New Baneshwor, Ward 10"
                        value={profileForm.address.street}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            address: { ...profileForm.address, street: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Seller Store Information (if seller) */}
                {user?.role === 'seller' && (
                  <div className="card-glass p-6 rounded-2xl space-y-4" style={{ border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <HiOutlineChartBar className="w-5 h-5 text-gold-400" style={{ color: 'var(--gold-400)' }} />
                      <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                        Seller Store Details
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="label">Store / Brand Name</label>
                        <input
                          value={profileForm.sellerInfo.storeName}
                          onChange={(e) => {
                            setProfileForm({
                              ...profileForm,
                              sellerInfo: { ...profileForm.sellerInfo, storeName: e.target.value },
                            })
                            if (profileTouched.storeName || profileErrors.storeName) {
                              validateProfileField('storeName', e.target.value)
                            }
                          }}
                          onBlur={() => handleProfileBlur('storeName')}
                          className={`input ${profileTouched.storeName && profileErrors.storeName ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                          placeholder="e.g. Himalayan Cricket Gear"
                        />
                        <AnimatePresence>
                          {profileTouched.storeName && profileErrors.storeName && (
                            <motion.div
                              initial={{ opacity: 0, y: -4, height: 0 }}
                              animate={{ opacity: 1, y: 0, height: 'auto' }}
                              exit={{ opacity: 0, y: -4, height: 0 }}
                              className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400"
                            >
                              <HiOutlineExclamationCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{profileErrors.storeName}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div>
                        <label className="label">Store Description & Specialty</label>
                        <textarea
                          value={profileForm.sellerInfo.storeDescription}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              sellerInfo: {
                                ...profileForm.sellerInfo,
                                storeDescription: e.target.value,
                              },
                            })
                          }
                          className="input resize-none"
                          rows={3}
                          placeholder="Tell cricketers about your gear craftsmanship and specialties..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button type="submit" disabled={loading} className="btn-primary px-8 py-3.5">
                    {loading ? 'Saving Details…' : 'Save Profile Details'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {tab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="card-glass p-6 rounded-2xl" style={{ border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-6">
                  <HiOutlineLockClosed className="w-5 h-5 text-gold-400" style={{ color: 'var(--gold-400)' }} />
                  <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                    Change Account Password
                  </h2>
                </div>

                <form onSubmit={handlePasswordChange} noValidate className="space-y-4 max-w-md">
                  <div>
                    <label className="label">Current Password *</label>
                    <input
                      type="password"
                      value={pwForm.currentPassword}
                      onChange={(e) => handlePwChange('currentPassword', e.target.value)}
                      onBlur={() => handlePwBlur('currentPassword')}
                      className={`input ${pwTouched.currentPassword && pwErrors.currentPassword ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                      placeholder="Enter existing password"
                    />
                    <AnimatePresence>
                      {pwTouched.currentPassword && pwErrors.currentPassword && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -4, height: 0 }}
                          className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400"
                        >
                          <HiOutlineExclamationCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{pwErrors.currentPassword}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label className="label">New Password *</label>
                    <input
                      type="password"
                      value={pwForm.newPassword}
                      onChange={(e) => handlePwChange('newPassword', e.target.value)}
                      onBlur={() => handlePwBlur('newPassword')}
                      className={`input ${pwTouched.newPassword && pwErrors.newPassword ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                      placeholder="Min. 6 characters"
                    />
                    <AnimatePresence>
                      {pwTouched.newPassword && pwErrors.newPassword && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -4, height: 0 }}
                          className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400"
                        >
                          <HiOutlineExclamationCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{pwErrors.newPassword}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* New Password Strength Meter */}
                    {pwForm.newPassword && (
                      <div className="mt-2 space-y-1.5 p-2.5 rounded-lg bg-black/20 border border-white/5">
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: 'var(--text-muted)' }}>Strength:</span>
                          <span className="font-semibold" style={{ color: newPwStrength.color }}>
                            {newPwStrength.label}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className="h-full flex-1 rounded-full transition-all duration-300"
                              style={{
                                background: step <= newPwStrength.score ? newPwStrength.color : 'rgba(255,255,255,0.08)',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label">Confirm New Password *</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={pwForm.confirmPassword}
                        onChange={(e) => handlePwChange('confirmPassword', e.target.value)}
                        onBlur={() => handlePwBlur('confirmPassword')}
                        className={`input ${pwTouched.confirmPassword && pwErrors.confirmPassword ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                        placeholder="Repeat new password"
                      />
                      {pwForm.confirmPassword && pwForm.newPassword === pwForm.confirmPassword && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 flex items-center gap-1 text-xs">
                          <HiCheck className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                    <AnimatePresence>
                      {pwTouched.confirmPassword && pwErrors.confirmPassword && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -4, height: 0 }}
                          className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400"
                        >
                          <HiOutlineExclamationCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{pwErrors.confirmPassword}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="pt-2">
                    <button type="submit" disabled={loading} className="btn-primary px-8 py-3.5">
                      {loading ? 'Updating Password…' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
