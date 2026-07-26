const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Electronics', 'Fashion', 'Home', 'Books', 'Sports', 'Beauty']
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 100
  },
  description: {
    type: String,
    default: ''
  },
  emoji: {
    type: String,
    default: '📦'
  },
  badge: {
    type: String,
    enum: ['', 'NEW', 'HOT', 'SALE', 'TOP'],
    default: ''
  },
  rating: {
    type: Number,
    default: 4.5,
    min: 0,
    max: 5
  },
  reviewsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
