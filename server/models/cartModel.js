import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// PRESCRIPTION
// ─────────────────────────────────────────────────────────────────────────────
//
// Per-eye optical prescription, captured at add-to-cart time for any
// product with isPrescriptionRequired: true (contact lenses, prescription
// eyeglasses). This describes the CUSTOMER, not the product — two people
// buying the same lens SKU can have completely different values here, so
// it lives on the cart item, not the product.
//
// Optional at the schema level: whether it's actually required is decided
// by cartController's addToCart handler by checking the referenced
// product's isPrescriptionRequired flag, since that check needs a DB
// lookup that a plain Mongoose validator can't cleanly do inline.
const eyePrescriptionSchema = new mongoose.Schema(
  {
    sphere: { type: Number, default: null },
    cylinder: { type: Number, default: null },
    axis: { type: Number, default: null, min: 0, max: 180 },
    // Multifocal/progressive lenses only
    addPower: { type: Number, default: null },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    rightEye: {
      type: eyePrescriptionSchema,
      default: () => ({}),
    },
    leftEye: {
      type: eyePrescriptionSchema,
      default: () => ({}),
    },

    // Pupillary distance. Single combined value is the common case;
    // pdRight/pdLeft cover the dual-PD case some prescriptions use.
    pd: { type: Number, default: null },
    pdRight: { type: Number, default: null },
    pdLeft: { type: Number, default: null },

    // Optional uploaded prescription photo/PDF, in place of (or alongside)
    // the typed fields above — same Cloudinary shape used elsewhere.
    file: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },

    // Free-text note from the customer (e.g. "same as last order")
    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: [300, "Prescription notes cannot exceed 300 characters"],
    },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT SELECTION
// ─────────────────────────────────────────────────────────────────────────────
//
// Snapshot of which color variant was chosen, captured at add-to-cart time.
// variantId references the specific entry in product.variants — kept as a
// plain ObjectId (not a ref/populate target, since variants are a
// sub-document array, not their own collection). color/colorHex/image are
// duplicated here as a display snapshot so the cart/order UI doesn't need
// to re-look-up the product's current variant list (which could change or
// have that variant removed later). Stock and price are NEVER trusted from
// this snapshot — those are re-validated against the live product on every
// cart read/write, same principle as cartItemSchema.price below.
const cartVariantSchema = new mongoose.Schema(
  {
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    colorHex: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },
  },
  { _id: false }
);

//Cart item sub-schema
//define structure for each cart item
const cartItemSchema = new mongoose.Schema(
  {
    //store product's MongoDBObjectid
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    //stores how many units customer wants
    //min:1(atleast one product)
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be atleast 1"],
      default: 1,
    },

    //used to keep snapshot of cart price to calculate cart total
    //but final checkout price is verified by backend
    //from product database
    //donot trust frontend price
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },

    // Present only when the referenced product has
    // isPrescriptionRequired: true. Each prescription is specific to one
    // person, so addToCart does NOT merge quantity into an existing line
    // for the same product when prescription data is involved — every
    // submission is its own line item, even if it duplicates an existing
    // product/prescription pair.
    prescription: {
      type: prescriptionSchema,
      default: null,
    },

    // Present only when the referenced product has variants and the
    // customer selected one. A product without variants (or a customer
    // who somehow adds one without picking a color) leaves this null,
    // and the item is treated as before — one line per product.
    variant: {
      type: cartVariantSchema,
      default: null,
    },
  },

  //idenfify cart items individually
  {
    _id: true,
  }
);

//Main cart schema
const cartSchema = new mongoose.Schema(
  {
    //connect cart with user
    //single cart per user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    //single cart contain multiple cart items
     items: {
      type: [cartItemSchema],
      default: [],
      validate: {
        validator: function (items) {
          return items.length <= 50;
        },
        message: "A cart cannot contain more than 50 products",
      },
    },

    //Coupon applied to the cart
    //coupon validition is ensured during checkout
    //from coupon model
    couponCode: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
      maxlength: [50, "Coupon code is too long"],
    },
  },

  {
    timestamps: true,
  }
);

//virtual: value that is calculated dynamically but not stored in mongodb
//quantity changed => automatically new total calculated
cartSchema.virtual("itemsPrice").get(function () {
  //reduce(): calculate total price of all cart items
  return this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
});

//calculate total quantity in cart (not different products count)
cartSchema.virtual("totalItems").get(function () {
  return this.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
});

//virtual value donot get stored in db
//API response not generated automatically
cartSchema.set("toJSON", {
  virtuals: true,
});

cartSchema.set("toObject", {
  virtuals: true,
});

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;