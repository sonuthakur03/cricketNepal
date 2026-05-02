// src/pages/ProductFormPage.jsx
// Used by sellers to Add or Edit a product

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlinePhotograph, HiOutlineX, HiOutlinePlus } from 'react-icons/hi'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { PRODUCT_CATEGORIES, getErrorMessage } from '../utils/helpers'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size',
  '6', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11',
  'Short Handle', 'Long Handle']

const EMPTY_FORM = {
  name: '', description: '', price: '', discountPrice: '',
  category: 'Bats', brand: '', stock: '',
  sizes: [], colors: [], tags: '',
  specifications: [{ key: '', value: '' }],
  isFeatured: false,
}

export default function ProductFormPage() {
  const { id } = useParams()            // id present → edit mode
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [existingImages, setExistingImages] = useState([])   // already-uploaded images (edit mode)
  const [newFiles, setNewFiles] = useState([])               // files chosen from disk
  const [previews, setPreviews] = useState([])               // blob URL previews
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [colorInput, setColorInput] = useState('')

  // ── Load existing product in edit mode ──────────────────────────────────────
  useEffect(() => {
    if (!isEdit) return
    api.get(`/products/${id}`)
      .then(({ data }) => {
        const p = data.data
        setForm({
          name: p.name,
          description: p.description,
          price: p.price,
          discountPrice: p.discountPrice || '',
          category: p.category,
          brand: p.brand,
          stock: p.stock,
          sizes: p.sizes || [],
          colors: p.colors || [],
          tags: p.tags?.join(', ') || '',
          specifications: p.specifications?.length ? p.specifications : [{ key: '', value: '' }],
          isFeatured: p.isFeatured,
        })
        setExistingImages(p.images || [])
      })
      .catch(() => toast.error('Failed to load product'))
      .finally(() => setFetching(false))
  }, [id])

  // Cleanup blob URLs on unmount
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews])

  // ── File picker ──────────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    const total = existingImages.length + newFiles.length + files.length
    if (total > 5) { toast.error('Maximum 5 images allowed'); return }
    setNewFiles((prev) => [...prev, ...files])
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
  }

  const removeNewFile = (index) => {
    URL.revokeObjectURL(previews[index])
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = async (publicId) => {
    if (!window.confirm('Remove this image?')) return
    try {
      await api.delete(`/products/${id}/images/${encodeURIComponent(publicId)}`)
      setExistingImages((prev) => prev.filter((img) => img.public_id !== publicId))
      toast.success('Image removed')
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  // ── Spec rows ────────────────────────────────────────────────────────────────
  const addSpec = () => setForm((f) => ({ ...f, specifications: [...f.specifications, { key: '', value: '' }] }))
  const removeSpec = (i) => setForm((f) => ({ ...f, specifications: f.specifications.filter((_, idx) => idx !== i) }))
  const updateSpec = (i, field, val) =>
    setForm((f) => ({ ...f, specifications: f.specifications.map((s, idx) => idx === i ? { ...s, [field]: val } : s) }))

  // ── Size toggle ──────────────────────────────────────────────────────────────
  const toggleSize = (size) =>
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(size) ? f.sizes.filter((s) => s !== size) : [...f.sizes, size],
    }))

  // ── Color add/remove ─────────────────────────────────────────────────────────
  const addColor = () => {
    const c = colorInput.trim()
    if (!c) return
    if (form.colors.includes(c)) { setColorInput(''); return }
    setForm((f) => ({ ...f, colors: [...f.colors, c] }))
    setColorInput('')
  }
  const removeColor = (c) => setForm((f) => ({ ...f, colors: f.colors.filter((x) => x !== c) }))

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim())        { toast.error('Product name is required'); return }
    if (!form.price || form.price <= 0) { toast.error('Valid price is required'); return }
    if (!form.stock && form.stock !== 0) { toast.error('Stock quantity is required'); return }
    if (existingImages.length + newFiles.length === 0) { toast.error('At least one image is required'); return }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name.trim())
      fd.append('description', form.description.trim())
      fd.append('price', form.price)
      fd.append('discountPrice', form.discountPrice || 0)
      fd.append('category', form.category)
      fd.append('brand', form.brand.trim())
      fd.append('stock', form.stock)
      fd.append('isFeatured', form.isFeatured)
      fd.append('sizes', form.sizes.join(','))
      fd.append('colors', form.colors.join(','))
      fd.append('tags', form.tags)
      fd.append('specifications', JSON.stringify(form.specifications.filter((s) => s.key && s.value)))
      newFiles.forEach((file) => fd.append('images', file))

      if (isEdit) {
        await api.put(`/products/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Product updated!')
      } else {
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Product created!')
      }

      navigate('/seller/dashboard')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return (
    <div className="page-container pt-28 py-12 min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" style={{ borderWidth: 3 }} />
    </div>
  )

  return (
    <div className="page-container pt-24 py-12 min-h-screen">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black mb-8" style={{ fontFamily: 'Syne, sans-serif' }}>
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* ── Main Fields ── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="card p-6 space-y-4">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Basic Information</h2>
                <div>
                  <label className="label">Product Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. SG Nexus Plus English Willow Bat"
                    className="input" required maxLength={100} />
                </div>
                <div>
                  <label className="label">Description *</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the product — materials, features, who it's for..."
                    className="input resize-none" rows={5} required maxLength={2000} />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{form.description.length}/2000</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Category *</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="input">
                      {PRODUCT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Brand *</label>
                    <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      placeholder="e.g. SG, MRF, Kookaburra"
                      className="input" required />
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="card p-6 space-y-4">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Pricing & Stock</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">Price (NPR) *</label>
                    <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="0" className="input" required min={0} />
                  </div>
                  <div>
                    <label className="label">Discount Price</label>
                    <input type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                      placeholder="0 = no discount" className="input" min={0} />
                  </div>
                  <div>
                    <label className="label">Stock *</label>
                    <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      placeholder="0" className="input" required min={0} />
                  </div>
                </div>
                {form.price && form.discountPrice && Number(form.discountPrice) > 0 && (
                  <p className="text-sm text-primary-600 font-semibold">
                    ✓ Discount: {Math.round(((form.price - form.discountPrice) / form.price) * 100)}% off
                  </p>
                )}
              </div>

              {/* Variants */}
              <div className="card p-6 space-y-4">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Variants</h2>

                {/* Sizes */}
                <div>
                  <label className="label">Sizes <span className="font-normal text-[var(--color-text-muted)]">(optional)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map((s) => (
                      <button key={s} type="button" onClick={() => toggleSize(s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                          form.sizes.includes(s)
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600'
                            : 'border-[var(--color-border)] hover:border-primary-400'
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <label className="label">Colors <span className="font-normal text-[var(--color-text-muted)]">(optional)</span></label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {form.colors.map((c) => (
                      <span key={c} className="badge-green flex items-center gap-1">
                        {c}
                        <button type="button" onClick={() => removeColor(c)}>
                          <HiOutlineX className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={colorInput} onChange={(e) => setColorInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                      placeholder="e.g. Red, Blue, White"
                      className="input text-sm flex-1" />
                    <button type="button" onClick={addColor}
                      className="btn-secondary py-2 px-4 text-sm">
                      <HiOutlinePlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div className="card p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Specifications</h2>
                  <button type="button" onClick={addSpec} className="btn-ghost text-sm py-1.5">
                    <HiOutlinePlus className="w-4 h-4" /> Add Row
                  </button>
                </div>
                {form.specifications.map((spec, i) => (
                  <div key={i} className="flex gap-3">
                    <input value={spec.key} onChange={(e) => updateSpec(i, 'key', e.target.value)}
                      placeholder="Key (e.g. Weight)" className="input text-sm flex-1" />
                    <input value={spec.value} onChange={(e) => updateSpec(i, 'value', e.target.value)}
                      placeholder="Value (e.g. 1.2 kg)" className="input text-sm flex-1" />
                    {form.specifications.length > 1 && (
                      <button type="button" onClick={() => removeSpec(i)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                        <HiOutlineX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div className="card p-6">
                <h2 className="font-bold text-lg mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Tags</h2>
                <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="e.g. english willow, professional, bat (comma-separated)"
                  className="input text-sm" />
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Helps with search visibility</p>
              </div>
            </div>

            {/* ── Sidebar ── */}
            <div className="space-y-6">
              {/* Images */}
              <div className="card p-5 space-y-3">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Product Images</h2>
                <p className="text-xs text-[var(--color-text-muted)]">Max 5 images · JPG, PNG, WebP · 5MB each</p>

                {/* Existing images (edit mode) */}
                {existingImages.map((img) => (
                  <div key={img.public_id} className="relative group">
                    <img src={img.url} alt="product" className="w-full h-36 object-cover rounded-xl bg-slate-100" />
                    <button type="button" onClick={() => removeExistingImage(img.public_id)}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <HiOutlineX className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* New file previews */}
                {previews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt="preview" className="w-full h-36 object-cover rounded-xl bg-slate-100" />
                    <button type="button" onClick={() => removeNewFile(i)}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <HiOutlineX className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Upload button */}
                {existingImages.length + newFiles.length < 5 && (
                  <label className="flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed border-[var(--color-border)] rounded-xl hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all cursor-pointer">
                    <HiOutlinePhotograph className="w-8 h-8 text-[var(--color-text-muted)]" />
                    <span className="text-sm text-[var(--color-text-muted)]">Click to upload images</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                )}
              </div>

              {/* Publish settings */}
              <div className="card p-5 space-y-3">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Publish Settings</h2>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={form.isFeatured}
                      onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
                    <div className={`w-10 h-5 rounded-full transition-colors ${form.isFeatured ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isFeatured ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Mark as Featured</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Appears on home page</p>
                  </div>
                </label>
              </div>

              {/* Submit */}
              <div className="space-y-3">
                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
                  {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Publish Product'}
                </button>
                <button type="button" onClick={() => navigate('/seller/dashboard')} className="btn-secondary w-full py-3">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
