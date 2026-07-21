# 🛍️ ShopSphere — Modern Glassmorphic E-Commerce Web Application

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-6366f1?style=for-the-badge&logo=github)](https://rajeshsoyeda-hash.github.io/E-eCommerce-/)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)
[![Repo](https://img.shields.io/badge/Repository-GitHub-8b5cf6?style=for-the-badge&logo=github)](https://github.com/rajeshsoyeda-hash/E-eCommerce-.git)

**ShopSphere** is a state-of-the-art, feature-rich E-Commerce Web Application crafted with modern **Glassmorphism design aesthetics**, dark mode slate color palette, real-time multi-faceted filter engine, interactive quick view product modals, LocalStorage state management, and an Admin Dashboard.

---

## 🌐 Live Demo & Repository
- **Live Website**: [https://rajeshsoyeda-hash.github.io/E-eCommerce-/](https://rajeshsoyeda-hash.github.io/E-eCommerce-/)
- **GitHub Repository**: [https://github.com/rajeshsoyeda-hash/E-eCommerce-.git](https://github.com/rajeshsoyeda-hash/E-eCommerce-.git)

---

## ✨ Key Features & Architecture

### 1. 🌌 Midnight Slate Design System & Glassmorphism
- **Modern Color Palette**: Deep Slate Navy (`#0B0F19` / `#0F172A`) with vibrant indigo-pink gradients and translucent glass surfaces.
- **Typography Scale**: Google Fonts (`Syne` for headers, `Plus Jakarta Sans` for UI body, `JetBrains Mono` for prices & order IDs).
- **CSS Keyframe Animations**: Hero text reveal delay, ambient background rotation (`floatBlob`), hover card lift (`translateY(-6px)`), image zoom (`scale(1.18)`), and shimmer skeleton loaders.

### 2. 🏝️ Floating Glassmorphic Navigation Header
- **Translucent Backdrop Blur**: `-webkit-backdrop-filter: blur(16px)` with glowing glass border.
- **Quick-Badge Cart Indicator**: Animated cart count pill with `@keyframes badgePop` trigger on item add.

### 3. ⚙️ Dynamic Product Filter & Full-Text Search Engine
- **Interactive Price Range Slider**: Real-time filtering between `₹0` and `₹2,00,000` with live price display.
- **Multi-Criteria Sorting**: Sort by Price (Low to High, High to Low), Rating (High to Low), and Featured.
- **Full-Text Instant Search**: Real-time search across product names, categories, descriptions, and badges.
- **Category Pills**: Multi-category filter pills (Electronics, Fashion, Home, Books, Sports, Beauty).

### 4. ⚡ Interactive Quick View Product Modal
- **Fast Scale-In Popup**: Click any product card to launch a Quick View modal without page reload.
- **Multi-Angle Thumbnails**: Switch between `📐 Front View`, `🔄 Angle View`, and `🔍 Detail View`.
- **Color & Size Variant Selectors**: Category-tailored color options (`Midnight Slate`, `Titanium Silver`, etc.) and size/storage specs (`128GB`, `256GB`, `512GB` / `S`, `M`, `L`).
- **Real-Time Stock Badge**: `✓ In Stock`, `⚠️ Low Stock`, or `❌ Out of Stock`.

### 5. 🛒 State-Managed Cart, Wishlist & Promo Code System
- **LocalStorage Sync**: Persists `ss_cart`, `ss_wishlist`, `ss_promo`, `ss_users`, and `ss_orders` across browser reloads.
- **Promo Code Validation**:
  - `SAVE10`: 10% instant discount.
  - `PROMO20`: 20% instant discount.
  - `WELCOME50`: 50% instant discount.
- **Real-Time Subtotal Pipeline**: Dynamic calculation of Subtotal, Promo Discount, Delivery Fee (Free over ₹499), and Final Total.
- **Quantity Stepper**: Instant `+` and `−` quantity buttons inside slide-in drawer.

### 6. 📦 Real-Time Inventory & Out-of-Stock Guard
- **Automatic Stock Deduction**: Order placement automatically reduces product stock in real time.
- **Out-of-Stock Lock**: Products with 0 stock display `OUT OF STOCK` badge and disable `Add to Cart` / `Buy Now` CTA buttons.

### 7. 🛡️ User Authentication & Admin Dashboard
- **Protected Routes**: Checkout, My Orders, and Admin pages require authentication guards.
- **Admin Portal**: View live revenue statistics, manage products, view user accounts, and update order status workflow (`Confirmed` ➔ `Shipped` ➔ `Delivered` / `Cancelled`).

---

## 🔑 Demo Accounts

Use these pre-seeded demo credentials to test user & admin roles:

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **User** | `user@shop.com` | `user123` | Shopping, Wishlist, Cart, Checkout, Order Tracking |
| **Admin** | `admin@shop.com` | `admin123` | Full Access + Admin Portal (Product/Order/User Management) |

---

## 📁 Project Structure

```
E-eCommerce--main/
├── index.html       # Clean HTML template & accessibility structure
├── styles.css       # Midnight Slate Glassmorphism design system & keyframe animations
├── db.js            # LocalStorage DB wrapper & seed data initializer
└── app.js           # Router, Auth, Filter Engine, Cart, Quick View Modal, & Admin Controllers
```

---

## 🚀 Getting Started Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rajeshsoyeda-hash/E-eCommerce-.git
   cd E-eCommerce-
   ```
2. **Launch the application**:
   - Double-click `index.html` to open in any web browser, OR
   - Serve using VS Code Live Server or python HTTP server:
     ```bash
     npx serve .
     ```

---

## 📜 License
Distributed under the **MIT License**. Created by [Rajesh Soyeda](https://github.com/rajeshsoyeda-hash).
