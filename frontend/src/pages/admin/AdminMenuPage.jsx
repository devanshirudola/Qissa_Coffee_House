import { useCallback, useEffect, useState } from 'react'
import {
  FiAlertCircle,
  FiCheck,
  FiCoffee,
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiStar,
  FiTrash2,
  FiX,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminMenuService } from '../../services/adminApi.js'

const formatPrice = (price) => `₹${Number(price || 0).toLocaleString('en-IN')}`

const sampleImages = [
  { label: 'Hot Coffee (Latte)', url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=85' },
  { label: 'Cold Brew / Iced', url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=900&q=85' },
  { label: 'Chai / Tea', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900&q=85' },
  { label: 'Croissant / Bakery', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=85' },
  { label: 'Brioche Toast', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85' },
  { label: 'Cake / Pastry', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85' },
  { label: 'Tart / Dessert', url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=85' },
]

export default function AdminMenuPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteProductConfirm, setDeleteProductConfirm] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    imageUrl: '',
    badge: '',
    isVegetarian: true,
    isAvailable: true,
    isFeatured: false,
  })

  const loadMenu = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminMenuService.list({
        search,
        category: selectedCategory,
      })
      setProducts(res.products || [])
      setCategories(res.categories || [])
    } catch {
      toast.error('Failed to load menu items.')
    } finally {
      setLoading(false)
    }
  }, [search, selectedCategory])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMenu()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, selectedCategory])

  function handleOpenCreate() {
    setEditingProduct(null)
    setFormData({
      name: '',
      price: '',
      category: categories[0]?._id || '',
      description: '',
      imageUrl: sampleImages[0].url,
      badge: 'HOUSE FAVOURITE',
      isVegetarian: true,
      isAvailable: true,
      isFeatured: false,
    })
    setModalOpen(true)
  }

  function handleOpenEdit(product) {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price,
      category: product.categoryId || product.category?._id || '',
      description: product.description,
      imageUrl: product.imageUrl,
      badge: product.badge || '',
      isVegetarian: product.isVegetarian ?? true,
      isAvailable: product.isAvailable ?? true,
      isFeatured: product.isFeatured ?? false,
    })
    setModalOpen(true)
  }

  async function handleToggleAvailability(product) {
    try {
      const nextAvailable = !product.isAvailable
      const updated = await adminMenuService.update(product._id, { isAvailable: nextAvailable })
      setProducts((prev) => prev.map((p) => (p._id === product._id ? { ...p, isAvailable: nextAvailable } : p)))
      toast.success(`${product.name} is now ${nextAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}`)
    } catch {
      toast.error('Failed to update availability.')
    }
  }

  async function handleToggleFeatured(product) {
    try {
      const nextFeatured = !product.isFeatured
      await adminMenuService.update(product._id, { isFeatured: nextFeatured })
      setProducts((prev) => prev.map((p) => (p._id === product._id ? { ...p, isFeatured: nextFeatured } : p)))
      toast.success(`${product.name} ${nextFeatured ? 'added to' : 'removed from'} featured menu`)
    } catch {
      toast.error('Failed to update featured status.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.name.trim() || !formData.price || !formData.description.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }

    setSubmitting(true)
    try {
      if (editingProduct) {
        const updated = await adminMenuService.update(editingProduct._id, formData)
        setProducts((prev) => prev.map((p) => (p._id === editingProduct._id ? updated : p)))
        toast.success(`Updated "${updated.name}" successfully.`)
      } else {
        const created = await adminMenuService.create(formData)
        setProducts((prev) => [created, ...prev])
        toast.success(`Added "${created.name}" to the menu!`)
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save menu product.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(product) {
    try {
      await adminMenuService.delete(product._id)
      setProducts((prev) => prev.filter((p) => p._id !== product._id))
      toast.success(`Deleted "${product.name}" from catalog.`)
    } catch {
      toast.error('Failed to delete item.')
    } finally {
      setDeleteProductConfirm(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ============================================================== */}
      {/* HEADER */}
      {/* ============================================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9d7857', fontWeight: 600 }}>
            Catalog & Live Pricing
          </div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', fontWeight: 500, margin: '4px 0 0', color: '#34231c' }}>
            Menu Management ({products.length})
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => loadMenu()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              background: '#ffffff',
              border: '1px solid #dcd2c4',
              borderRadius: '2px',
              fontSize: '11px',
              color: '#49372c',
              cursor: 'pointer',
            }}
          >
            <FiRefreshCw /> Refresh
          </button>

          <button
            onClick={handleOpenCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              background: '#34231c',
              color: '#fffaf4',
              border: 'none',
              borderRadius: '2px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            <FiPlus />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TOOLBAR */}
      {/* ============================================================== */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e9e0d5',
          borderRadius: '4px',
          padding: '16px 20px',
          display: 'flex',
          gap: '14px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#88766a' }} />
          <input
            type="text"
            placeholder="Search items by name, description, badge…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 34px 9px 34px',
              border: '1px solid #ded2c4',
              background: '#faf8f3',
              fontSize: '11px',
              color: '#34231c',
              borderRadius: '2px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#88766a',
                cursor: 'pointer',
              }}
            >
              <FiX />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '9px 14px',
            border: '1px solid #ded2c4',
            background: '#faf8f3',
            fontSize: '11px',
            color: '#34231c',
            borderRadius: '2px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* ============================================================== */}
      {/* MENU PRODUCTS TABLE */}
      {/* ============================================================== */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e9e0d5',
          borderRadius: '4px',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(52,35,28,0.03)',
        }}
      >
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#88766a', fontSize: '12px' }}>
            Loading menu catalog…
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: '70px 20px', textAlign: 'center' }}>
            <FiCoffee style={{ fontSize: '36px', color: '#a47e5d', marginBottom: '14px' }} />
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', margin: '0 0 6px', color: '#34231c' }}>
              No Menu Items Found
            </h3>
            <p style={{ fontSize: '11px', color: '#88766a', margin: '0 0 16px' }}>
              Add a new beverage or bakery item to the cafe menu.
            </p>
            <button
              onClick={handleOpenCreate}
              style={{
                background: '#34231c',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                fontSize: '11px',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            >
              Add First Item
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '950px' }}>
              <thead>
                <tr style={{ background: '#f8f5ef', borderBottom: '1px solid #e9e0d5', textAlign: 'left', color: '#88766a' }}>
                  <th style={{ padding: '12px 16px' }}>Product</th>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px' }}>Price</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Dietary</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Availability</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Featured</th>
                  <th style={{ padding: '12px 16px' }}>Badge</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p._id}
                    style={{
                      borderBottom: '1px solid #f0e9df',
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = '#faf8f4')}
                    onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
                  >
                    {/* Product & Photo */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          style={{
                            width: '42px',
                            height: '42px',
                            objectFit: 'cover',
                            borderRadius: '3px',
                            border: '1px solid #e9e0d5',
                          }}
                        />
                        <div>
                          <b style={{ color: '#34231c', fontSize: '12px' }}>{p.name}</b>
                          <small style={{ display: 'block', color: '#88766a', fontSize: '10px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.description}
                          </small>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '12px 16px', color: '#68564b' }}>
                      <span
                        style={{
                          background: '#f8f5ef',
                          border: '1px solid #e9e0d5',
                          padding: '3px 8px',
                          borderRadius: '2px',
                          fontSize: '10px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {p.categoryName || 'Uncategorized'}
                      </span>
                    </td>

                    {/* Price */}
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#34231c', fontSize: '12px' }}>
                      {formatPrice(p.price)}
                    </td>

                    {/* Vegetarian */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '12px',
                          height: '12px',
                          border: `1.5px solid ${p.isVegetarian ? '#15803d' : '#b91c1c'}`,
                          borderRadius: '2px',
                          position: 'relative',
                        }}
                        title={p.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: p.isVegetarian ? '#15803d' : '#b91c1c',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                          }}
                        />
                      </span>
                    </td>

                    {/* Available Toggle */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleToggleAvailability(p)}
                        style={{
                          padding: '4px 10px',
                          background: p.isAvailable ? '#dcfce7' : '#fee2e2',
                          color: p.isAvailable ? '#15803d' : '#b91c1c',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '9px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                        }}
                      >
                        {p.isAvailable ? 'In Stock' : 'Sold Out'}
                      </button>
                    </td>

                    {/* Featured Toggle */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleToggleFeatured(p)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: p.isFeatured ? '#d97706' : '#d1c7bc',
                          fontSize: '17px',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                        title={p.isFeatured ? 'Featured on homepage' : 'Not featured'}
                      >
                        <FiStar style={{ fill: p.isFeatured ? '#d97706' : 'none' }} />
                      </button>
                    </td>

                    {/* Badge */}
                    <td style={{ padding: '12px 16px', color: '#88766a', fontSize: '9px' }}>
                      {p.badge || '—'}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          style={{
                            padding: '6px 10px',
                            background: '#f8f5ef',
                            border: '1px solid #ded2c4',
                            borderRadius: '2px',
                            color: '#49372c',
                            cursor: 'pointer',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Edit Product"
                        >
                          <FiEdit2 /> Edit
                        </button>

                        <button
                          onClick={() => setDeleteProductConfirm(p)}
                          style={{
                            padding: '6px 8px',
                            background: '#fee2e2',
                            border: '1px solid #fecaca',
                            borderRadius: '2px',
                            color: '#b91c1c',
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                          title="Delete Product"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* ADD / EDIT PRODUCT MODAL */}
      {/* ============================================================== */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(36,24,18,0.65)',
            backdropFilter: 'blur(3px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 70,
            padding: '20px',
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e9e0d5',
              borderRadius: '4px',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                background: '#34231c',
                color: '#fffaf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a47e5d', fontWeight: 600 }}>
                  Menu Catalog
                </span>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', margin: '2px 0 0' }}>
                  {editingProduct ? `Edit ${editingProduct.name}` : 'Add New Menu Item'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#fffaf4', fontSize: '20px', cursor: 'pointer' }}
              >
                <FiX />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#88766a', marginBottom: '5px' }}>
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Saffron Cloud Latte"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#88766a', marginBottom: '5px' }}>
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="260"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#88766a', marginBottom: '5px' }}>
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={inputStyle}
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#88766a', marginBottom: '5px' }}>
                    Badge Tag (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HOUSE FAVOURITE"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#88766a', marginBottom: '5px' }}>
                  Description *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Artisanal description of the coffee, bake or food pairing…"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#88766a', marginBottom: '5px' }}>
                  Image URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/…"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  style={inputStyle}
                />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <small style={{ color: '#88766a', fontSize: '9px', width: '100%' }}>Sample Quick Presets:</small>
                  {sampleImages.map((s, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setFormData({ ...formData, imageUrl: s.url })}
                      style={{
                        padding: '3px 8px',
                        background: '#f8f5ef',
                        border: '1px solid #ded2c4',
                        borderRadius: '2px',
                        fontSize: '9px',
                        cursor: 'pointer',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  background: '#f8f5ef',
                  padding: '12px 16px',
                  borderRadius: '3px',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px' }}>
                  <input
                    type="checkbox"
                    checked={formData.isVegetarian}
                    onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                  />
                  <span>Vegetarian Item</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px' }}>
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  />
                  <span>Available to Order</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px' }}>
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  />
                  <span>Feature on Home</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '9px 16px',
                    background: '#f8f5ef',
                    border: '1px solid #ded2c4',
                    borderRadius: '2px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '9px 20px',
                    background: '#34231c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: submitting ? 'wait' : 'pointer',
                  }}
                >
                  {submitting ? 'Saving…' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ============================================================== */}
      {deleteProductConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(36,24,18,0.7)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 80,
            padding: '20px',
          }}
          onClick={() => setDeleteProductConfirm(null)}
        >
          <div
            style={{
              background: '#ffffff',
              padding: '24px',
              borderRadius: '4px',
              maxWidth: '400px',
              width: '100%',
              border: '1px solid #e9e0d5',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626', marginBottom: '12px' }}>
              <FiAlertCircle style={{ fontSize: '22px' }} />
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '17px', margin: 0 }}>
                Delete Menu Item?
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#68564b', lineHeight: 1.5, margin: '0 0 20px' }}>
              Are you sure you want to remove <b>“{deleteProductConfirm.name}”</b> from the café catalog?
              This will remove the item from the public customer menu.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDeleteProductConfirm(null)}
                style={{
                  background: '#f8f5ef',
                  border: '1px solid #ded2c4',
                  padding: '8px 14px',
                  borderRadius: '2px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  color: '#49372c',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteProductConfirm)}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '2px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #ded2c4',
  background: '#faf8f3',
  fontSize: '11px',
  color: '#34231c',
  borderRadius: '2px',
  outline: 'none',
  boxSizing: 'border-box',
}
