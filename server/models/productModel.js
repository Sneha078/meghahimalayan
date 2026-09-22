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
      enum: ["eyeglasses", "watches", "perfumes"],
      trim: true,
    },

    brand: {
      type: String,
      required: [true, "Please enter a product brand"],
      trim: true,
    },

    //product subcategory optional fields
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

productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ sellingPrice: 1 });
productSchema.index({ ratings: -1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ isNewArrival: 1, newArrivalNotified: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;