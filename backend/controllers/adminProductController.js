import mongoose from 'mongoose'
import Product from '../models/Product.js'
import Category from '../models/Category.js'

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function listAdminProducts(req, res, next) {
  try {
    const { category, search, available, featured } = req.query
    const filter = {}

    if (available === 'true') filter.isAvailable = true
    if (available === 'false') filter.isAvailable = false
    if (featured === 'true') filter.isFeatured = true

    if (category && category !== 'all') {
      if (mongoose.isValidObjectId(category)) {
        filter.category = category
      } else {
        const cat = await Category.findOne({
          $or: [{ slug: category.toLowerCase() }, { name: category }],
        })
        if (cat) filter.category = cat._id
      }
    }

    if (search && search.trim()) {
      const term = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { badge: { $regex: term, $options: 'i' } },
      ]
    }

    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1, name: 1 })
      .lean()

    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean()

    return res.json({
      success: true,
      data: {
        products: products.map((p) => ({
          ...p,
          categoryName: p.category?.name || 'Uncategorized',
          categoryId: p.category?._id || '',
        })),
        categories,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function createAdminProduct(req, res, next) {
  try {
    const {
      name,
      price,
      description,
      category,
      imageUrl,
      badge = '',
      isVegetarian = true,
      isAvailable = true,
      isFeatured = false,
      ingredients = [],
    } = req.body ?? {}

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required.' })
    }

    const cleanPrice = Number(price)
    if (isNaN(cleanPrice) || cleanPrice < 0) {
      return res.status(400).json({ success: false, message: 'Valid positive price is required.' })
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Product description is required.' })
    }

    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return res.status(400).json({ success: false, message: 'Product image URL is required.' })
    }

    // Resolve Category
    let categoryId = category
    if (!mongoose.isValidObjectId(category)) {
      let cat = await Category.findOne({ name: String(category).trim() })
      if (!cat) {
        cat = await Category.create({
          name: String(category).trim() || 'Bakery & Specials',
          slug: slugify(String(category).trim() || 'bakery-specials'),
          sortOrder: 10,
          isActive: true,
        })
      }
      categoryId = cat._id
    }

    // Unique Slug Generation
    let baseSlug = slugify(name)
    let finalSlug = baseSlug
    let counter = 1
    while (await Product.exists({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${counter}`
      counter++
    }

    const product = await Product.create({
      name: name.trim(),
      slug: finalSlug,
      category: categoryId,
      description: description.trim(),
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      price: cleanPrice,
      imageUrl: imageUrl.trim(),
      badge: (badge || '').trim(),
      isVegetarian: Boolean(isVegetarian),
      isAvailable: Boolean(isAvailable),
      isFeatured: Boolean(isFeatured),
      isPublished: true,
      isSample: false,
    })

    const populated = await Product.findById(product._id).populate('category', 'name slug').lean()

    return res.status(201).json({
      success: true,
      data: {
        ...populated,
        categoryName: populated.category?.name || 'Uncategorized',
        categoryId: populated.category?._id || '',
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function updateAdminProduct(req, res, next) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Invalid product ID.' })
    }

    const {
      name,
      price,
      description,
      category,
      imageUrl,
      badge,
      isVegetarian,
      isAvailable,
      isFeatured,
      ingredients,
    } = req.body ?? {}

    const update = {}
    if (typeof name === 'string' && name.trim()) update.name = name.trim()
    if (price !== undefined) {
      const p = Number(price)
      if (!isNaN(p) && p >= 0) update.price = p
    }
    if (typeof description === 'string' && description.trim()) update.description = description.trim()
    if (typeof imageUrl === 'string' && imageUrl.trim()) update.imageUrl = imageUrl.trim()
    if (typeof badge === 'string') update.badge = badge.trim()
    if (isVegetarian !== undefined) update.isVegetarian = Boolean(isVegetarian)
    if (isAvailable !== undefined) update.isAvailable = Boolean(isAvailable)
    if (isFeatured !== undefined) update.isFeatured = Boolean(isFeatured)
    if (Array.isArray(ingredients)) update.ingredients = ingredients

    if (category) {
      if (mongoose.isValidObjectId(category)) {
        update.category = category
      } else {
        let cat = await Category.findOne({ name: String(category).trim() })
        if (!cat) {
          cat = await Category.create({
            name: String(category).trim(),
            slug: slugify(String(category).trim()),
            sortOrder: 10,
            isActive: true,
          })
        }
        update.category = cat._id
      }
    }

    const updated = await Product.findByIdAndUpdate(id, { $set: update }, { new: true })
      .populate('category', 'name slug')
      .lean()

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found.' })
    }

    return res.json({
      success: true,
      data: {
        ...updated,
        categoryName: updated.category?.name || 'Uncategorized',
        categoryId: updated.category?._id || '',
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteAdminProduct(req, res, next) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Invalid product ID.' })
    }

    // Soft unpublish or permanent delete
    const deleted = await Product.findByIdAndDelete(id).lean()
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found.' })
    }

    return res.json({ success: true, message: 'Product removed from menu successfully.' })
  } catch (error) {
    next(error)
  }
}

export async function listAdminCategories(_req, res, next) {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean()
    return res.json({ success: true, data: categories })
  } catch (error) {
    next(error)
  }
}

export async function createAdminCategory(req, res, next) {
  try {
    const { name, sortOrder = 0 } = req.body ?? {}
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' })
    }

    const cleanName = name.trim()
    const slug = slugify(cleanName)

    const category = await Category.findOneAndUpdate(
      { name: cleanName },
      { $setOnInsert: { name: cleanName, slug, sortOrder: Number(sortOrder) || 0, isActive: true } },
      { upsert: true, new: true }
    ).lean()

    return res.status(201).json({ success: true, data: category })
  } catch (error) {
    next(error)
  }
}
