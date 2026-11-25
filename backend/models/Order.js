import mongoose from 'mongoose'
import { randomBytes } from 'node:crypto'

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, max: 50 },
  isSample: { type: Boolean, default: false },
}, { _id: false })

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, default: () => `QIS-${randomBytes(4).toString('hex').toUpperCase()}` },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: { type: [orderItemSchema], required: true, validate: value => value.length > 0 },
  customerName: { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, lowercase: true, trim: true },
  customerPhone: { type: String, required: true, trim: true, maxlength: 30 },
  orderType: { type: String, enum: ['pickup'], default: 'pickup' },
  note: { type: String, default: '', trim: true, maxlength: 500 },
  subtotal: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'], default: 'Pending' },
  paymentMethod: { type: String, enum: ['pay_at_cafe', 'cash', 'upi', 'card'], default: 'pay_at_cafe' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
  isSample: { type: Boolean, default: false },
}, { timestamps: true })

orderSchema.index({ status: 1, paymentStatus: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema)
