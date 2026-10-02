import mongoose from "mongoose";

//product has reviews
//seperate review schema that defines structure for review
//this stores by whom the review is written
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
    }, //reviewer name

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    }, //1-5 range

    comment: {
      type: String,
      required: true,
      trim: true,
    }, //customer review

    // Review photos uploaded to cloudinary
    images: [
      {
        public_id: {
          type: String,
          default: "",
        },
        url: {
          type: String,
          required: true,
        },
      }
    ],
    videos: [
      {
        public_id: {
          type: String,
          default: ""
        },
        url: {
          type: String,
          required: true,
        }
      }
    ]
  },
  { timestamps: true }
);

// Color variant — each color gets its own photo set, stock, and optional
// price override. Products without variants (most perfumes, some
// simple SKUs) just leave this array empty and use the flat `color` field.
const variantSchema = new mongoose.Schema(
  {
    color: {
      type: String,
      required: [true, "Variant color name is required"],
      trim: true,
    },

    // For a quick swatch/dot elsewhere in the UI (cart line items, order
    // history) — the actual selector UI uses `images`, not this.
    colorHex: {
      type: String,
      trim: true,
      default: "",
    },

    images: [
      {
        public_id: {
          type: String,
          default: "",
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],

    stock: {
      type: Number,
      default: 0,
      min: [0, "Variant stock cannot be negative"],
    },

    sku: {
      type: String,
      trim: true,
      default: "",
    },

    // Full price for this variant - replaces product price when set
    // null = use product price
    price: {
      type: Number,
      default: null,
      min: [0, "Variant price cannot be negative"],
      validate: {
        validator: function(value) {
          // If discountPrice is set, price must be higher
          if (this.discountPrice !== null && this.discountPrice !== undefined && value !== null) {
            return value > this.discountPrice;
          }
          return true;
        },
        message: "Variant price must be higher than variant discount price"
      }
    },

    // Full discounted price for this variant - replaces product discountPrice when set
    // null = no variant-specific discount
    discountPrice: {
      type: Number,
      default: null,
      min: [0, "Variant discount price cannot be negative"],
      validate: {
        validator: function(value) {
          // If price is set, discountPrice must be lower
          if (this.price !== null && this.price !== undefined && value !== null) {
            return value < this.price;
          }
          // If no variant price but product has price, discount must be lower than product price
          return true;
        },
        message: "Variant discount price must be lower than variant price"
      }
    },
  },
  { _id: true }
);

//Product schema
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter a product name"],
      trim: true,
    },

    //URL Friendly version for a product
    //eg: rayban-classic is easy to use instead of Ray Ban Classic Eyeglasses
    //to make it easy to use in url
    slug: {
      type: String,
      unique: true,
      sparse: true, // allows multiple documents with no slug (null)
      trim: true,
      lowercase: true,
    },

    description: {
      type: String,
      required: [true, "Please enter a product description"],
    },

    // for average rating
    ratings: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    //product images from cloudinary
    image: [
      {
        public_id: {
          type: String,
          default: "",
        },

        url: {
          type: String,
          required: true,
        },
      },
    ],

    //Product category for filtering
    category: {
      type: String,
      required: [true, "Please enter a product category"],
      enum: ["eyeglasses", "watches", "perfumes", "contact-lenses"],
      trim: true,
    },

    brand: {
      type: String,
      required: [true, "Please enter a product brand"],
      trim: true,
    },

    //product subcategory optional fields
    //for contact-lenses this is expected to be "Prescriptive" or
    //"Non-Prescriptive" (kept as free text like the other categories'
    //subcategory usage, rather than a hard enum, so admins aren't blocked
    //if a new subcategory value is needed later)
    subcategory: {
      type: String,
      default: "",
      trim: true,
    },

    //targetted gender for product
    gender: {
      type: String,
      enum: ["Men", "Women", "Kids", "Unisex"],
      default: "Unisex",
    },

    //product color for filtering and display
    //applies to all categories (frame colors, dial colors, perfume bottle colors, contact lens colors, etc.)
    color: {
      type: String,
      default: "",
      trim: true,
    },
    // present only for products sold in multiple colors. When non-empty, the frontend should drive the color picker + per-color stock off this array instead of the flat `color`/`stock` fields aboce.
    variants: {
      type: [variantSchema],
      default: []
    },

    //Productoriginal  price
    price: {
      type: Number,
      required: [true, "Please enter a product price"],
      min: [0, "Price cannot be negative"],
    },

    //stores sellingprice after discount
    // null means no discount; a value means the selling price
    discountPrice: {
      type: Number,
      default: null,
      min: [0, "Discount price cannot be negative"],
      validate: {
        validator: function(value) {
          // Only validate when both discountPrice and price are present
          // on the same document. During findByIdAndUpdate, `this` is the
          // query context and this.price is undefined — skip the check
          // here and rely on the pre-save hook to enforce the invariant
          // when a full save occurs.
          if (value !== null && value !== undefined && value > 0 && this.price !== undefined && this.price !== null && this.price > 0) {
            return Number(value) < Number(this.price);
          }
          return true;
        },
        message: "Discount price must be lower than regular price"
      }
    },

    // Storefront price the customer actually pays (discountPrice ?? price).
    // STORED as a real field (kept in sync by the hooks below) so MongoDB
    // Atlas can sort/filter on it — Atlas rejects sorting on fields computed
    // on the fly inside an aggregation.
    sellingPrice: {
      type: Number,
      default: 0,
      min: [0, "Selling price cannot be negative"],
    },

    //featured/Best seller/ New arrival
    isFeatured: {
      type: Boolean,
      default: false,
    },

    isBestSeller: {
      type: Boolean,
      default: false,
    },

    isNewArrival: {
      type: Boolean,
      default: false,
    },

    // True after the "New Arrivals" email campaign has been sent for this
    // product. Reset to false whenever an admin re-marks the product as a
    // new arrival, so it becomes eligible for a future campaign again.
    newArrivalNotified: {
      type: Boolean,
      default: false,
    },

    //product quantity availability
    stock: {
      type: Number,
      required: [true, "Please enter product stock"],
      default: 0,
      min: [0, "Stock cannot be negative"],
    },

    //indicates product availability
    isOutOfStock: {
      type: Boolean,
      default: false,
    },

    // ─────────────────────────────────────────────────────────────────────
    // PRESCRIPTION
    // ─────────────────────────────────────────────────────────────────────
    //
    // Not category-specific — applies to any product where the customer
    // needs to supply their own prescription (contact lenses, prescription
    // eyeglasses). When true, addToCart requires prescription details on
    // the cart item; the storefront's product page shows the prescription
    // entry form for this product.
    isPrescriptionRequired: {
      type: Boolean,
      default: false,
    },

    // Eyeglasses specific attributes
    frameShape: {
      type: String,
      default: "",
    },

    frameMaterial: {
      type: String,
      default: "",
    },

    frameColor: {
      type: String,
      default: "",
    },

    lensType: {
      type: String,
      default: "",
    },

    // Watches
    watchType: {
      type: String,
      default: "",
    },

    dialColor: {
      type: String,
      default: "",
    },

    strapMaterial: {
      type: String,
      default: "",
    },

    caseSize: {
      type: String,
      default: "",
    },

    movementType: {
      type: String,
      default: "",
    },

    waterResistance: {
      type: String,
      default: "",
    },

    // Perfumes
    fragranceFamily: {
      type: String,
      default: "",
    },

    fragranceType: {
      type: String,
      default: "",
    },

    volume: {
      type: String,
      default: "",
    },

    // Contact Lenses
    // Fixed properties of the lens SKU itself — not the customer's
    // prescription, which lives on the cart/order item instead.
    baseCurve: {
      type: String,
      default: "",
    },

    diameter: {
      type: String,
      default: "",
    },

    waterContent: {
      type: String,
      default: "",
    },

    // e.g. "Daily", "Bi-Weekly", "Monthly"
    replacementSchedule: {
      type: String,
      default: "",
    },

    // e.g. "30 lenses", "6 lenses"
    packSize: {
      type: String,
      default: "",
    },

    //product bhitra multiple reviews store hunxa
    reviews: [reviewSchema],

    numOfReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Admin who created the product
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    //how many coins are required to redeem this product?
    pointsCost: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Keeps sellingPrice (the displayed discountPrice ?? price) in sync on
// create/save. See the likely sibling pre("findOneAndUpdate") hook below.
productSchema.pre("save", function (next) {
  this.sellingPrice = this.discountPrice != null
    ? Number(this.discountPrice)
    : Number(this.price);
  next();
});

// Keeps isOutOfStock in sync whenever stock changes through ANY update —
// direct assignment ({ stock: n }, $set) or quantity changes ($inc, used by
// order creation and stock restore). Without this, the product-card
// out-of-stock indicator goes stale the moment stock is touched.
productSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const body = update.$set || update;

  // Keep sellingPrice (discountPrice ?? price) in sync when either field
  // is written. If only one side is provided, pull the other from the doc.
  if (body.price !== undefined || body.discountPrice !== undefined) {
    let basePrice = body.price;
    let discount = body.discountPrice;
    if (basePrice === undefined || discount === undefined) {
      const current = await this.model
        .findOne(this.getFilter(), { price: 1, discountPrice: 1 })
        .lean();
      if (basePrice === undefined) basePrice = current?.price;
      if (discount === undefined) discount = current?.discountPrice ?? null;
    }
    body.sellingPrice =
      discount != null ? Number(discount) : Number(basePrice ?? 0);
  }

  let assignedStock;
  if (Array.isArray(update.variants) && update.variants.length > 0){
    update.stock = update.variants.reduce(
      (sum, v) => sum + (Number(v.stock) || 0), 0
    )
  }
  if (update.stock !== undefined) {
    assignedStock = update.stock;
  } else if (update.$set && update.$set.stock !== undefined) {
    assignedStock = update.$set.stock;
  }

  const delta = update.$inc && update.$inc.stock !== undefined
    ? update.$inc.stock
    : undefined;

  if (assignedStock === undefined && delta === undefined) {
    return next();
  }

  let newStock;
  if (assignedStock !== undefined) {
    newStock = Number(assignedStock);
  } else {
    // $inc needs the current value to compute the resulting stock.
    const current = await this.model
      .findOne(this.getFilter(), { stock: 1 })
      .lean();
    newStock = Number(current ? current.stock : 0) + Number(delta);
  }

  const target = update.$set || update;
  target.isOutOfStock = newStock === 0;

  next();
});

//database index to make products search, filtering and sorting faster.
productSchema.index({
  name: "text",
  brand: "text",
  description: "text",
});

// Single field indexes
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ sellingPrice: 1 });
productSchema.index({ ratings: -1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ isNewArrival: 1, newArrivalNotified: 1 });

// Compound indexes for common filter combinations
// Category + brand (most common filter combination)
productSchema.index({ category: 1, brand: 1 });

// Category + price range (category filtering with price sort)
productSchema.index({ category: 1, sellingPrice: 1 });

// Category + gender (common in eyeglasses/watches)
productSchema.index({ category: 1, gender: 1 });

// Category + subcategory (filtering within category)
productSchema.index({ category: 1, subcategory: 1 });

// Featured/bestseller with category (homepage/category featured items)
productSchema.index({ category: 1, isFeatured: 1 });
productSchema.index({ category: 1, isBestSeller: 1 });

// Price range queries (min/max filtering)
productSchema.index({ sellingPrice: 1, category: 1 });

// Stock availability queries
productSchema.index({ category: 1, stock: 1 });

// New arrivals by category
productSchema.index({ category: 1, isNewArrival: 1, createdAt: -1 });

const Product = mongoose.model("Product", productSchema);

export default Product;