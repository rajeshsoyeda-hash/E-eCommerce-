const mongoose = require('mongoose');
const crypto = require('crypto');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  emoji: { type: String, default: '📦' }
}, { _id: false });

const shippingAddressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pinCode: { type: String, required: true },
  fullAddress: { type: String }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    ref: 'User'
  },
  customerName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  orderItems: [orderItemSchema],
  shippingAddress: shippingAddressSchema,
  pricing: {
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Card', 'COD'],
    default: 'UPI'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

// Static helper: Generate 8-digit unique Order ID (e.g. "ORD-84920173")
orderSchema.statics.generateOrderId = async function() {
  let isUnique = false;
  let orderId = '';
  while (!isUnique) {
    const randomDigits = crypto.randomInt(10000000, 99999999);
    orderId = `ORD-${randomDigits}`;
    const existing = await this.findOne({ orderId });
    if (!existing) isUnique = true;
  }
  return orderId;
};

module.exports = mongoose.model('Order', orderSchema);
