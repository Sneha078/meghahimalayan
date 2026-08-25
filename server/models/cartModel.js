import mongoose from "mongoose";

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
      min: 0,
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
    items: [cartItemSchema],

    //Coupon applied to the cart
    //coupon validition is ensured during checkout
    //from coupon model
    couponCode: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
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