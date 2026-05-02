// src/pages/ProfilePage.jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineCamera } from 'react-icons/hi'
import useAuthStore from '../context/authStore'
import { NEPAL_PROVINCES, NEPAL_CITIES, getErrorMessage } from '../utils/helpers'
import api from '../utils/api'

export default function ProfilePage() {
  const { user, updateProfile, changePassword, fetchMe } = useAuthStore()
  const [tab, setTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: {
      street:   user?.address?.street || '',
      city:     user?.address?.city || '',
      district: user?.address?.district || '',
      province: user?.address?.province || '',
    },
    sellerInfo: {
      storeName:        user?.sellerInfo?.storeName || '',
      storeDescription: user?.sellerInfo?.storeDescription || '',
    },
  })

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await updateProfile(profileForm)
    if (result.success) toast.success('Profile updated!')
    else toast.error(result.message)
    setLoading(false)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Passwords do not match'); return
    }
    setLoading(true)
    const result = await changePassword(pwForm.currentPassword, pwForm.newPassword)
    if (result.success) {
      toast.success('Password changed!')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } else {
      toast.error(result.message)
    }
    setLoading(false)
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      await api.put('/auth/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await fetchMe()
      toast.success('Avatar updated!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setAvatarLoading(false)
    }
  }

  return (
    <div className="page-container pt-24 py-12 min-h-screen">
      <h1 className="text-3xl font-black mb-8" style={{ fontFamily: 'Syne, sans-serif' }}>My Profile</h1>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-5 text-center mb-4">
            <div className="relative inline-block mb-4">
              <img src={user?.avatar?.url} alt={user?.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-primary-200 dark:border-primary-800 mx-auto" />
              <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors shadow-md">
                {avatarLoading
                  ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  : <HiOutlineCamera className="w-4 h-4 text-white" />
                }
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
            <p className="font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>{user?.name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{user?.email}</p>
            <span className={`badge mt-2 capitalize ${user?.role === 'admin' ? 'badge-red' : user?.role === 'seller' ? 'badge-gold' : 'badge-green'}`}>
              {user?.role}
            </span>
          </div>
          <nav className="card p-2 space-y-1">
            {[
              { key: 'profile',  label: 'Profile Info',  icon: <HiOutlineUser className="w-4 h-4" /> },
              { key: 'security', label: 'Security',       icon: <HiOutlineLockClosed className="w-4 h-4" /> },
            ].map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  tab === t.key
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600'
                    : 'text-[var(--color-text)] hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3">
          {tab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <form onSubmit={handleProfileSave} className="space-y-6">
                <div className="card p-6 space-y-4">
                  <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Personal Information</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Full Name</label>
                      <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="input" required />
                    </div>
                    <div>
                      <label className="label">Phone Number</label>
                      <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+977 98XXXXXXXX" className="input" />
                    </div>
                  </div>
                </div>

                <div className="card p-6 space-y-4">
                  <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Address</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Province</label>
                      <select className="input" value={profileForm.address.province}
                        onChange={(e) => setProfileForm({ ...profileForm, address: { ...profileForm.address, province: e.target.value } })}>
                        <option value="">Select province</option>
                        {NEPAL_PROVINCES.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">City</label>
                      <input list="cities-profile" className="input" value={profileForm.address.city}
                        onChange={(e) => setProfileForm({ ...profileForm, address: { ...profileForm.address, city: e.target.value } })} />
                      <datalist id="cities-profile">{NEPAL_CITIES.map((c) => <option key={c} value={c} />)}</datalist>
                    </div>
                    <div>
                      <label className="label">District</label>
                      <input className="input" value={profileForm.address.district}
                        onChange={(e) => setProfileForm({ ...profileForm, address: { ...profileForm.address, district: e.target.value } })} />
                    </div>
                    <div>
                      <label className="label">Street / Tole</label>
                      <input className="input" value={profileForm.address.street}
                        onChange={(e) => setProfileForm({ ...profileForm, address: { ...profileForm.address, street: e.target.value } })} />
                    </div>
                  </div>
                </div>

                {user?.role === 'seller' && (
                  <div className="card p-6 space-y-4">
                    <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Seller Info</h2>
                    <div>
                      <label className="label">Store Name</label>
                      <input value={profileForm.sellerInfo.storeName}
                        onChange={(e) => setProfileForm({ ...profileForm, sellerInfo: { ...profileForm.sellerInfo, storeName: e.target.value } })}
                        className="input" />
                    </div>
                    <div>
                      <label className="label">Store Description</label>
                      <textarea value={profileForm.sellerInfo.storeDescription}
                        onChange={(e) => setProfileForm({ ...profileForm, sellerInfo: { ...profileForm.sellerInfo, storeDescription: e.target.value } })}
                        className="input resize-none" rows={3} />
                    </div>
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary px-8">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </motion.div>
          )}

          {tab === 'security' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card p-6">
                <h2 className="font-bold text-lg mb-5" style={{ fontFamily: 'Syne, sans-serif' }}>Change Password</h2>
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div>
                    <label className="label">Current Password</label>
                    <input type="password" value={pwForm.currentPassword}
                      onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                      className="input" required />
                  </div>
                  <div>
                    <label className="label">New Password</label>
                    <input type="password" value={pwForm.newPassword}
                      onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                      className="input" required minLength={6} />
                  </div>
                  <div>
                    <label className="label">Confirm New Password</label>
                    <input type="password" value={pwForm.confirmPassword}
                      onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                      className="input" required />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
