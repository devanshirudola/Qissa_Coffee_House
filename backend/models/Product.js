import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  description: { type: String, required: true, trim: true, maxlength: 600 },
  ingredients: { type: [String], default: [] },
  price: { type: Number, required: true, min: 0 },
  imageUrl: { type: String, required: true, trim: true },
  badge: { type: String, default: '', trim: true, maxlength: 40 },
  isVegetarian: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isSample: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
  sourceLabel: { type: String, enum: ['development_sample', 'instagram_reference'] },
}, { timestamps: true })

productSchema.index({ isAvailable: 1, isFeatured: 1, category: 1 })

export default mongoose.model('Product', productSchema)
