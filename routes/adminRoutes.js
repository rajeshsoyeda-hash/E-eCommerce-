const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Apply verifyToken and verifyAdmin middleware to all admin endpoints
router.use(verifyToken, verifyAdmin);

/**
 * GET /api/admin/stats
 * Admin dashboard statistics summary
 */
router.get('/stats', async (req, res) => {
  try {
    const productsCount = await Product.countDocuments();
    const ordersCount = await Order.countDocuments();
    const usersCount = await User.countDocuments();
    
    const revenueData = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    return res.json({
      success: true,
      data: {
        productsCount,
        ordersCount,
        usersCount,
        totalRevenue
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load dashboard stats.',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/orders
 * Fetch all orders with optional status filter and search query
 */
router.get('/orders', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.orderStatus = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { orderId: searchRegex },
        { customerName: searchRegex },
        { phone: searchRegex }
      ];
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin orders.',
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/orders/:id/status
 * Dynamically update order status (Pending -> Confirmed -> Shipped -> Delivered -> Cancelled)
 */
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const allowedStatuses = ['Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Allowed: ${allowedStatuses.join(', ')}`
      });
    }

    const order = await Order.findOne({
      $or: [{ _id: req.params.id }, { orderId: req.params.id }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    order.orderStatus = orderStatus;
    
    // Automatically update paymentStatus if Delivered
    if (orderStatus === 'Delivered' && order.paymentStatus === 'Pending') {
      order.paymentStatus = 'Paid';
    }

    await order.save();

    return res.json({
      success: true,
      message: `Order ${order.orderId} status updated to "${orderStatus}".`,
      data: order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status.',
      error: error.message
    });
  }
});

/**
 * DELETE /api/admin/orders/:id
 * Delete an order by ID
 */
router.delete('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({
      $or: [{ _id: req.params.id }, { orderId: req.params.id }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    return res.json({
      success: true,
      message: `Order ${order.orderId} deleted successfully.`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete order.',
      error: error.message
    });
  }
});

module.exports = router;
