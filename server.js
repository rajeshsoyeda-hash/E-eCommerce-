const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopsphere';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, './')));

// Mount API Routes
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'ShopSphere E-Commerce API is running smooth',
    timestamp: new Date().toISOString()
  });
});

// Fallback route to serve index.html for Single Page App
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Connect MongoDB & Start Express Server
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Database successfully!');
    app.listen(PORT, () => {
      console.log(`🚀 ShopSphere Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.warn('⚠️ Could not connect to MongoDB:', err.message);
    console.log(`🚀 ShopSphere Server running in Standalone/Local Mode at http://localhost:${PORT}`);
    app.listen(PORT);
  });

module.exports = app;
