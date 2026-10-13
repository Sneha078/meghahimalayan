# 📚 Megha Himalayan — Platform Documentation Portal

Welcome to the central documentation hub for **Megha Himalayan**, Nepal's omnichannel e-commerce platform specializing in designer eyewear, prescription optical lenses, watches, and luxury fragrances.

---

## 📂 Documentation Library

This documentation suite consists of two dedicated manuals designed for internal operations and customer education:

### 1. [Administrator & Staff Operations Manual](./ADMIN_MANUAL.md)
> **Audience:** Store Owners, Operations Managers, Optical Interns, and Technical Operators.
- **Key Modules Covered:**
  - **Admin Routing Architecture (Frontend & Backend):**
    - Client-side `<AdminRoute>` guards, unauthenticated redirects, and role-based redirects (`intern` vs. `admin`)
    - Dynamic sidebar filtering in `AdminLayout` (`INTERN_PATHS` filter)
    - Code-splitting with `React.lazy()`, `<Suspense>`, and isolated `<ErrorBoundary>` blocks
    - Complete frontend admin route inventory (16 distinct views)
    - Backend security pipeline: `verifyUserAuth` (JWT cookie verification, password change checks) & `roleBasedAccess` (401/403 handlers)
    - Complete backend admin REST API inventory with controller mappings
    - Visual Mermaid request lifecycle flowchart
  - **Live Dashboard:** Real-time WebSocket order events and financial counters
  - **Catalog Management:** Eyeglasses, Contact Lenses, Watches, Perfumes, and multi-color variants
  - **Prescription & Orders:** Optical verification ($SPH$, $CYL$, $Axis$, $PD$, doctor's slip photo review) & PDF tax invoices
  - **Returns & Refunds:** Physical condition inspections and eSewa / Khalti / Bank transfer disbursals
  - **Promotions & Marketing:** Fixed/percentage coupons, order caps, and public toggles
  - **Loyalty Program:** 30-day points ledger, redemption limits, and automatic crediting
  - **Media Library:** Cloudinary asset tree, folders, and moves
  - **Standard Operating Procedures (SOPs):** Daily fulfillment and returns inspection checklists

---

### 2. [Customer User Guide & Shopping Manual](./USER_MANUAL.md)
> **Audience:** End-User Customers, Client Stakeholders, and Customer Support Representatives explaining customer-facing features.
- **Key Features Covered:**
  - Account Registration, Profile Setup & Address Management
  - Catalog Browsing, Search & Filter Navigation
  - Complete Guide to Choosing Eyewear (Face shapes, frame materials & skin tone matching)
  - Customizing Lenses & Submitting Prescriptions (Manual $OD$/$OS$ entry vs. Photo Upload)
  - Wishlist & Customer Reviews (Star ratings, photo & video uploads, AI Sentiment Summaries)
  - Shopping Cart, Coupon Codes & Points Redemption
  - 3-Step Checkout Workflow (Delivery ➔ Payment ➔ Review)
  - Nepalese Payment Options: Cash on Delivery (COD), eSewa, Khalti & Direct Bank Transfer
  - Shipping Policy, Free Shipping Thresholds (Rs. 5,000+), and PDF Tax Invoice Downloads
  - Order Tracking & Real-Time Status Meaning
  - Hassle-Free Returns, Exchanges & Refund Procedures for COD orders
  - Customer Service Contacts & Comprehensive Shopping FAQ

---

## ⚡ Quick Navigation

| What are you trying to do? | Recommended Guide |
| :--- | :--- |
| **Understand how Admin Routes work (Frontend guards & Backend API pipeline)** | [Admin Manual: Section 2](./ADMIN_MANUAL.md#2-how-admin-routes-work-frontend--backend-routing-architecture) |
| **Verify a customer's eye prescription & process an order** | [Admin Manual: Section 5](./ADMIN_MANUAL.md#5-optical-prescription--order-fulfillment-workflow) |
| **Add a new frame or sunglasses with multi-color swatches** | [Admin Manual: Section 4](./ADMIN_MANUAL.md#4-product-catalog--variant-management) |
| **Process a return and disburse an eSewa / Bank refund** | [Admin Manual: Section 6](./ADMIN_MANUAL.md#6-returns-physical-inspections--refund-disbursals) |
| **Create a holiday discount code / coupon** | [Admin Manual: Section 7](./ADMIN_MANUAL.md#7-promotional-coupons--marketing-campaigns) |
| **Learn how to enter sphere, cylinder, and PD for prescription glasses** | [User Manual: Section 4](./USER_MANUAL.md#4-customizing-lenses--submitting-prescriptions) |
| **Track order status and download PDF invoices** | [User Manual: Section 9 & 10](./USER_MANUAL.md#9-shipping-delivery--pdf-invoices) |
| **Request a return or exchange from customer account** | [User Manual: Section 11](./USER_MANUAL.md#11-returns-exchanges--warranty-policy) |
