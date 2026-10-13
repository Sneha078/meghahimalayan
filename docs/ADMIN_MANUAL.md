# 📘 Megha Himalayan — Administrator & Staff Operations Manual

> **System Version:** 2.0 (Eyewear, Lifestyle & Optical Platform)  
> **Currency:** Nepalese Rupee (NPR / Rs.)  
> **Target Audience:** Store Administrators, Inventory Managers, Fulfillment & Optical Interns, Customer Support Staff

---

## 📑 Table of Contents
1. [System Architecture & Role-Based Access Control](#1-system-architecture--role-based-access-control)
2. [Admin Dashboard & Real-Time Monitoring](#2-admin-dashboard--real-time-monitoring)
3. [Product Catalog & Variant Management](#3-product-catalog--variant-management)
4. [Optical Prescription & Order Fulfillment Workflow](#4-optical-prescription--order-fulfillment-workflow)
5. [Returns, Physical Inspections & Refund Disbursals](#5-returns-physical-inspections--refund-disbursals)
6. [Promotional Coupons & Marketing Campaigns](#6-promotional-coupons--marketing-campaigns)
7. [Customer Rewards & Points Ledger](#7-customer-rewards--points-ledger)
8. [Media Library & Asset Management (Cloudinary)](#8-media-library--asset-management-cloudinary)
9. [Customer CRM & Staff Role Assignment](#9-customer-crm--staff-role-assignment)
10. [Inquiry Messages & Live Socket Notifications](#10-inquiry-messages--live-socket-notifications)
11. [Sales Analytics & Business Intelligence](#11-sales-analytics--business-intelligence)
12. [Standard Operating Procedures (SOPs) & Checklists](#12-standard-operating-procedures-sops--checklists)
13. [Troubleshooting & Frequently Asked Questions](#13-troubleshooting--frequently-asked-questions)

---

## 1. System Architecture & Role-Based Access Control

The platform enforces strict role-based separation of concerns to safeguard financial data and customer privacy while allowing operational staff to manage catalog inventory.

### Role Hierarchy & Permissions Matrix

| Module / Feature | Super Admin (`admin`) | Operations Intern (`intern`) | Standard Customer (`user`) |
| :--- | :---: | :---: | :---: |
| **Sales Analytics & Revenue Metrics** | ✅ Full Access | ❌ Restricted | ❌ No Access |
| **Orders & Invoicing** | ✅ Full Access | ❌ Restricted | 🔍 Own Orders Only |
| **Returns & Refund Disbursals** | ✅ Full Access | ❌ Restricted | 🔍 Own Returns Only |
| **Product Catalog & Stock** | ✅ Full Access | ✅ Full Access | 👁️ View & Buy |
| **Media Library (Cloudinary)** | ✅ Full Access | ✅ Full Access | ❌ No Access |
| **Coupons & Discount Codes** | ✅ Full Access | ❌ Restricted | 🏷️ Redeem at Checkout |
| **User Directory & Role Assignment** | ✅ Full Access | ❌ Restricted | ❌ No Access |
| **Customer Contact Messages** | ✅ Full Access | ❌ Restricted | ✉️ Submit Inquiries |
| **Points Ledger Audits** | ✅ Full Access | ❌ Restricted | 🎁 Earn & Redeem |

> 🔒 **Security Notice:** The system automatically restricts navigation items and API routes based on role. Users with the `intern` role can only see **Products** and **Media Library** in their navigation bar.

---

## 2. Admin Dashboard & Real-Time Monitoring

**Route:** `/admin/dashboard`

The dashboard functions as the real-time operational cockpit for daily store performance. It connects via **Socket.IO** to receive live order and notification events without page refreshes.

### Key Metrics & Indicators:
- **Total Revenue (Rs.):** Aggregated earnings from confirmed and delivered transactions.
- **Total Orders:** Live volume of orders placed across all statuses.
- **Total Products:** Total active SKUs in the catalog.
- **Registered Customers:** Total registered customer accounts.
- **Live Indicator Pulse:** A green pulsing badge in the top right confirms active real-time socket connectivity.
- **Recent Orders Table:** Quick-glance view of the last 10 orders with instant status badges (`Processing`, `Confirmed`, `Shipped`, `Delivered`, `Cancelled`).

---

## 3. Product Catalog & Variant Management

**Routes:** List: `/admin/products` | New: `/admin/products/new` | Edit: `/admin/products/:id/edit`

Megha Himalayan manages four specialized product verticals: **Eyeglasses, Contact Lenses, Watches, and Perfumes**.

### A. General Information
- **Product Name:** Standard full title (e.g., *Ray-Ban Aviator Classic Polarized*).
- **Description:** Formatted product summary highlighting styling, dimensions, and specifications.
- **Category:** `eyeglasses`, `contact-lenses`, `watches`, or `perfumes`.
- **Brand:** Manufacturer or brand label (e.g., *Ray-Ban, Oakley, Casio, Dior*).
- **Subcategory:** Contextual classification (e.g., `Prescriptive` vs. `Non-Prescriptive` for contact lenses, `Aviator` for sunglasses).
- **Gender:** Select from `Men`, `Women`, `Kids`, or `Unisex`.
- **Pricing & Discounts:**
  - **Regular Price (`price`):** Standard price in NPR.
  - **Discount Price (`discountPrice`):** Offer price.
  - *Validation Rule:* `discountPrice` must be strictly lower than `price`. If invalid, the form will reject submission.
- **Stock:** Total base unit inventory.
- **Marketing Toggles:**
  - `isFeatured`: Showcases product on homepage hero sections.
  - `isBestSeller`: Adds Best Seller badge across product grids.
  - `isNewArrival`: Features item in seasonal arrival sliders and email newsletters.
- **Points Cost:** (Optional) Point value required if item is redeemable exclusively through reward points.

### B. Vertical-Specific Technical Attributes

#### 👓 Eyeglasses
- **Frame Shape:** Oval, Round, Square, Rectangle, Cat Eye, Aviator, Geometric, Browline.
- **Frame Material:** Acetate, Titanium, Metal, TR-90, Wood, Ultem.
- **Frame Color:** Black, Tortoise, Gold, Silver, Gunmetal, Clear, Rose Gold.
- **Lens Type:** Single Vision, Progressive, Blue-Cut Digital, Zero Power, Polarized Sunglass.

#### 👁️ Contact Lenses
- **Base Curve (BC):** Standard curvature in millimeters (e.g., `8.6mm`).
- **Diameter (DIA):** Lens diameter in millimeters (e.g., `14.2mm`).
- **Water Content (%):** Moisture percentage (e.g., `38%`, `55%`, `69%`).
- **Replacement Schedule:** `Daily Disposable`, `Bi-Weekly`, `Monthly`, `Quarterly`, `Yearly`.
- **Pack Size:** Number of lenses per pack (e.g., `2 Lenses`, `6 Lenses`, `30 Lenses`).
- **Prescription Required:** Toggle indicating whether an optical power selection is mandatory before cart insertion.

#### ⌚ Watches
- **Watch Type:** Analog, Digital, Chronograph, Automatic, Smartwatch.
- **Dial Color:** Color of the watch face.
- **Strap Material:** Genuine Leather, Stainless Steel Mesh, Silicone, Ceramic, Titanium.
- **Case Size:** Diameter in millimeters (e.g., `40mm`, `44mm`).
- **Movement Type:** Japanese Quartz, Swiss Automatic, Solar.
- **Water Resistance:** `3 ATM (30m)`, `5 ATM (50m)`, `10 ATM (100m)`, `20 ATM (200m)`.

#### 🌸 Perfumes
- **Fragrance Family:** Woody, Floral, Fresh, Oriental, Citrus, Aromatic.
- **Fragrance Type:** Eau de Parfum (EDP), Eau de Toilette (EDT), Parfum, Cologne.
- **Volume:** Milliliters (e.g., `50ml`, `100ml`, `150ml`).

### C. Multi-Color Variants & Variant Image Galleries
For products with multiple colorways:
1. Click **Add Variant**.
2. Enter **Color Name** (e.g., `Havana Tortoise`).
3. Set **Hex Color Code** (e.g., `#6F4E37`) for visual color swatches.
4. Set **Variant Stock** and unique **SKU**.
5. Set **Variant Price / Discount Price** if that specific colorway has a pricing tier differential.
6. Upload variant-specific images. When customers toggle colors on the frontend, the image carousel automatically switches to that color's photo set.

---

## 4. Optical Prescription & Order Fulfillment Workflow

**Routes:** List: `/admin/orders` | Details: `/admin/orders/:id`

Eyewear fulfillment demands meticulous verification to prevent optical dispensing errors.

### The Order Status Lifecycle

```
[Processing] ──► [Confirmed] ──► [Shipped] ──► [Delivered]
      │
      └──► [Cancelled] (If customer requested, out of stock, or invalid prescription)
```

### Optical Prescription Inspection Checklist
When opening an order containing eyeglasses or prescriptive contact lenses, review the **Prescription Snapshot**:
1. **Right Eye ($OD$):**
   - **Sphere ($SPH$):** Distance/near correction (+8.00 to -12.00).
   - **Cylinder ($CYL$):** Astigmatism correction.
   - **Axis:** Astigmatism angle (0° to 180°). Must be present if Cylinder is specified.
   - **Add Power ($ADD$):** Reading addition for bifocals / progressive lenses.
2. **Left Eye ($OS$):** SPH, CYL, Axis, ADD.
3. **Pupillary Distance ($PD$):**
   - Single PD (e.g., `62mm`) or Dual PD (`PD Right` / `PD Left`, e.g., `31mm / 31mm`).
4. **Prescription Attachment:** Click the uploaded photo/scan of the doctor’s slip to verify clinic doctor signature, patient name, and prescription date.
5. **Special Instructions / Notes:** Read any customer comments regarding frame fitting, tinted lenses, or PD measurements.

### Payment Verification
- **Cash on Delivery (COD):** Check phone validity before dispatch. Call customer if address details are incomplete.
- **eSewa & Khalti:** Automated digital confirmation.
- **Direct Bank Transfer:** Review the uploaded payment receipt screenshot. Reconcile deposit amount against company bank balance before setting status to `Confirmed`.

### Invoice Generation
Click **Download Invoice** to generate a PDF tax invoice containing:
- Order number, creation date, and tracking code.
- Customer details, shipping address, and phone number.
- Itemized list with frame model, lens coatings, and optical prescription table.
- Coupon deductions, reward points redeemed, shipping fees, and final net total.

---

## 5. Returns, Physical Inspections & Refund Disbursals

**Routes:** List: `/admin/returns` | Details: `/admin/returns/:id`

Megha Himalayan provides a structured workflow for handling return requests, warranty claims, and refunds.

### The Return Lifecycle

```
[Pending] ──► [Approved] ──► [Item Received] ──► [Completed] (Refund Disbursed)
    │                                 │
    └──► [Rejected]                   └──► [Rejected] (Failed physical inspection)
```

### Admin Return Processing Steps:
1. **Initial Review (`Pending`):**
   - Review customer return reason: `Wrong Item Received`, `Damaged Item`, `Not As Described`, `Changed Mind`, `Missing Parts/Accessories`, or `Other`.
   - Review uploaded customer photos of the item defect or packaging.
   - If valid, change status to **`Approved`** and add **Admin Remarks** with instructions on sending the item to the warehouse.
2. **Physical Inspection Upon Arrival (`Item Received`):**
   - Once the courier delivers the package to the warehouse, inspect each returned product.
   - Record **Item Condition**:
     - `Unopened`: Original factory seal intact.
     - `Opened/Good`: Opened but pristine condition, no scratches.
     - `Damaged/Defective`: Scratched lenses, broken hinges, cosmetic wear.
     - `Missing Parts`: Protective case, microfiber cloth, or accessories absent.
   - Toggle **Restockable**: Enable if item can be safely returned to live store stock.
3. **Refund Authorization & Disbursal (`Completed`):**
   - Select **Refund Method**:
     - `eSewa/Khalti`: Reverse payment or manual wallet transfer.
     - `Bank Transfer`: Direct bank transfer to the customer's provided account.
     - `Store Credit`: Account credit for alternative product selection.
     - `Original Payment Method`: Automated digital payment reversal.
   - Enter **Approved Refund Amount** (deducting delivery charges if return reason is "Changed Mind").
   - Record the transaction bank reference number in remarks.
   - Click **Process Refund**. The customer is notified via email and in-app alert.

---

## 6. Promotional Coupons & Marketing Campaigns

**Route:** `/admin/coupons`

Create, monitor, and expire discount codes.

### Configuration Fields:
- **Code:** Case-insensitive alphanumeric code (e.g., `DASHAIN15`, `FESTIVE500`).
- **Discount Type:**
  - `percentage`: Deducts a percentage from the cart subtotal.
  - `fixed`: Deducts an exact rupee amount.
- **Discount Value:** Numeric percentage or rupee value.
- **Minimum Order Value (`minOrder`):** Cart total required to apply coupon (e.g., Rs. 3,000).
- **Maximum Discount Cap (`maxDiscount`):** Caps percentage discounts (e.g., 20% off up to a maximum cap of Rs. 1,000).
- **Usage Limits:**
  - `usageLimit`: Total allowable redemptions across all store customers.
  - `perUserLimit`: Maximum times a single customer account can apply the code (typically `1`).
- **Expires At:** Date and time after which the coupon automatically disables.
- **Public Promotion Toggle (`isPublic`):**
  - If enabled, the coupon appears in banner marquees and checkout suggestions.
  - If disabled, the coupon remains private for exclusive marketing or customer apology tokens.

---

## 7. Customer Rewards & Points Ledger

The platform runs a loyalty program integrated into the MongoDB `PointsLedger`.

### Rules & Parameters:
- **Earning Rate:** **1 Point earned for every Rs. 100 spent** on completed purchases.
- **Credit Timing:** Points are credited automatically when order status reaches `Delivered` (for COD) or upon successful digital payment.
- **Redemption Rate:** **10 Points = Rs. 1 discount** at checkout.
- **Safety Cap:** Points discount can cover at most **20%** of an order's net subtotal.
- **Expiration Window:** Unused points expire after **30 days**.
- **Idempotency Protection:** The system prevents duplicate points awards through compound unique indexes on `{ order: 1, type: "earn" }`.

---

## 8. Media Library & Asset Management (Cloudinary)

**Route:** `/admin/media`

A centralized visual asset manager for catalog imagery, campaign lookbooks, and site banners.

### Features:
- **Folder Navigation:** Organize assets into structured directories (e.g., `/collections/spring-eyewear/acetate`).
- **Folder Creation & Deletion:** Add new directories or delete empty folders.
- **Direct Upload:** Upload multiple PNG, JPEG, or WebP files with automatic compression and CDN delivery.
- **Asset Moving:** Move assets between folders without altering permanent Cloudinary public URLs.
- **Asset Deletion:** Permanently purge outdated banner or discontinued product photos.

---

## 9. Customer CRM & Staff Role Assignment

**Routes:** List: `/admin/users` | Detail: `/admin/users/:id`

- **Customer Dossier:** View customer email, full name, phone number, saved delivery addresses, registration date, accumulated points, and lifetime orders.
- **Role Assignment:** Update access roles between `user`, `intern`, and `admin`.
  - To assign an intern: Select `intern` from the role dropdown.
  - Changes take effect on the staff member's next session or navigation click.

---

## 10. Inquiry Messages & Live Socket Notifications

### Contact Messages (`/admin/messages`)
Manages inquiries submitted through the store's public `/contact` form.
- Filter messages by status: `New` (Unread), `Read`, `Replied`, `Closed`.
- Expand messages to view sender email, phone number, subject, and text inquiry.
- Update message statuses to keep customer support tickets organized.

### Real-Time Notifications (`/admin/notifications`)
- Bell icon in the admin header displays unread alert badges.
- Alerts trigger automatically when:
  - A customer places a new order.
  - A customer submits a return request.
  - A product falls below minimum stock thresholds.
  - A contact message is submitted.
- One-click mark as read or mark all as read.

---

## 11. Sales Analytics & Business Intelligence

**Route:** `/admin/analytics`

Comprehensive business intelligence reporting:
- **Revenue Trends:** Visual charts of daily, weekly, and monthly sales volume.
- **Average Order Value (AOV):** Tracks basket size dynamics over time.
- **Top Selling Products:** Identifies best-performing frames, lenses, and lifestyle SKUs.
- **Top Customers:** Identifies high-lifetime-value VIP customers for targeted marketing.

---

## 12. Standard Operating Procedures (SOPs) & Checklists

### SOP 1: Daily Morning Order Fulfillment Checklist
- [ ] Open `/admin/dashboard` and review unread notifications.
- [ ] Filter `/admin/orders` by status `Processing`.
- [ ] For each eyewear order:
  - [ ] Verify lens selection (Single Vision, Blue Cut, Progressive).
  - [ ] Check optical parameters ($SPH$, $CYL$, $Axis$, $PD$).
  - [ ] Compare manual inputs against the doctor's prescription slip photo.
  - [ ] If prescription is unclear or $PD$ is missing, hold order and message customer.
- [ ] For Bank Transfer orders, verify payment receipt in company bank account.
- [ ] Change status to `Confirmed`. Print packing slip and PDF invoice.
- [ ] Hand over packaged parcel to courier dispatch and update status to `Shipped`.

### SOP 2: Returns & Warranty Inspection Checklist
- [ ] Review new requests in `/admin/returns`.
- [ ] Verify whether order was delivered within the valid return window.
- [ ] Once received at warehouse, inspect frame alignment, lens surface scratches, and accessories.
- [ ] Fill out condition report (`Unopened`, `Opened/Good`, `Damaged/Defective`).
- [ ] If restockable, toggle inventory restock.
- [ ] Disburse refund via eSewa, Khalti, or Bank Transfer and record reference code.
- [ ] Change status to `Completed`.

---

## 13. Troubleshooting & Frequently Asked Questions

**Q: A customer entered Sphere power but forgot Pupillary Distance ($PD$). Can we process the lenses?**  
*A:* No. Lenses edged without an accurate $PD$ will cause optical prism distortion, eye strain, and headaches. Place the order on hold, call or email the customer, and request their optical clinic $PD$ measurement.

**Q: An intern cannot see the orders or revenue analytics. Is there a glitch?**  
*A:* No. This is intended by design. The `intern` role is restricted exclusively to Products and the Media Library to protect business finances and customer privacy.

**Q: Why was a discount price not saved when updating a product?**  
*A:* The system requires that `discountPrice` must be strictly lower than regular `price`. Ensure the discount price is not greater than or equal to the regular price.

**Q: When are loyalty points credited for Cash on Delivery (COD) orders?**  
*A:* Points are credited only when the order status is updated to `Delivered`. If an order is marked `Cancelled`, points are never issued.
