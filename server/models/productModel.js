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
// SKU/price override. Products without variants (most perfumes, some
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

    // Some colors cost more (e.g. limited edition tortoise vs. standard
    // black) — added to the base `price`, can be 0 or negative.
    priceDelta: {
      type: Number,
      default: 0,
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

//pre-save middleware
//runs before a product is saved to mongodb
productSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate()
  if (Array.isArray(update.variants) && update.variants.length > 0){
    update.stock = update.variants.reduce(
      (sum, v) => sum + (Number(v.stock) || 0), 0
    )
  }
  if (update.stock !== undefined) {
    update.isOutOfStock = 
      update.stock === 0;
  }
  next();
});

//database index to make products search, filtering and sorting faster.
productSchema.index({
  name: "text",
  brand: "text",
  description: "text",
});

productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ ratings: -1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isBestSeller: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;