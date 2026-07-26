const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { verifyToken } = require('../middleware/auth');

/**
 * POST /api/orders
 * Public / Authenticated: Place a new order
 */
router.post('/', async (req, res) => {
  try {
    const { userId, name, phone, address, pin, city, state, cart, paymentMethod } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty. Order must contain at least one item.'
      });
    }

    if (!name || !phone || !address || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Missing delivery information (name, phone, address, pin Code).'
      });
    }

    // Check stock & deduct stock for each product if using MongoDB Products
    for (const item of cart) {
      if (item.productId && typeof item.productId === 'string' && item.productId.length === 24) {
        const prod = await Product.findById(item.productId);
        if (prod) {
          if (prod.stock < item.qty) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for ${prod.name}. Only ${prod.stock} units available.`
            });
          }
          prod.stock = Math.max(0, prod.stock - item.qty);
          await prod.save();
        }
      }
    }

    // Calculate subtotal, delivery fee, and total amount
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty || 1)), 0);
    const deliveryFee = subtotal >= 499 ? 0 : 40;
    const totalAmount = subtotal + deliveryFee;

    // Generate Unique 8-digit Order ID
    const orderId = await Order.generateOrderId();

    const newOrder = new Order({
      orderId,
      userId: userId || 'GUEST',
      customerName: name,
      phone: phone,
      orderItems: cart.map(item => ({
        productId: item.productId || item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.qty || 1),
        emoji: item.emoji || '📦'
      })),
      shippingAddress: {
        name,
        phone,
        street: address,
        city: city || 'Indore',
        state: state || 'Madhya Pradesh',
        pinCode: pin,
        fullAddress: `${address}, ${city || 'Indore'}, ${state || 'Madhya Pradesh'} - ${pin}`
      },
      pricing: {
        subtotal,
        discount: 0,
        deliveryFee
      },
      totalAmount,
      paymentMethod: paymentMethod || 'UPI',
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Pending',
      orderStatus: 'Pending' // Default Status
    });

    const savedOrder = await newOrder.save();

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      orderId: savedOrder.orderId,
      data: savedOrder
    });

  } catch (error) {
    console.error('Error in POST /api/orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to place order.',
      error: error.message
    });
  }
});

/**
 * GET /api/orders/my-orders
 * Fetch logged-in user's orders
 */
router.get('/my-orders', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user orders.',
      error: error.message
    });
  }
});

/**
 * GET /api/orders/:id
 * Get single order details
 */
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({
      $or: [{ _id: req.params.id }, { orderId: req.params.id }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    return res.json({
      success: true,
      data: order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching order details.',
      error: error.message
    });
  }
});

module.exports = router;
