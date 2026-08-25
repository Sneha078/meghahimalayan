import Product from "../models/productModel.js";
import HandleError from "../utils/handleError.js"; //application error handle
import handleAsyncError from "../middleware/handleAsyncError.js"; //asynchronous error handle
import APIFunctionality from "../utils/apiFunctionality.js"; //Product search/filter/sort/pagination ko common logic handle garcha.
import cloudinary from "../config/cloudinary.js"; //product images upload/del in cloudinary

//Helper functions

//product id or slug through product find
const findProduct = async (id) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  return isObjectId
    ? Product.findById(id)
    : Product.findOne({ slug: id });
};

//Product images upload from cloudinary
const uploadImages = async (images) => {
  const links = [];

  for (const img of images) {
    const result = await cloudinary.uploader.upload(img, {
      folder: "products",
    });

    links.push({
      public_id: result.public_id,
      url: result.secure_url,
    });
  }

  return links;
};

// Delete image from cloudinary using public_id
const destroyImages = async (images) => {
  for (const img of images) {
    if (img.public_id) {
      await cloudinary.uploader.destroy(img.public_id);
    }
  }
};

//Get all products
// GET /api/v1/products
// Supports: keyword, category, brand, gender, minPrice, maxPrice,
//           inStock, discount, featured, bestSeller, new,
//           sort, page, limit
export const getAllProducts = handleAsyncError(async (req, res, next) => {
  //default : 12 products per page
  const resultsPerPage = Math.min(
    Number(req.query.limit) || 12,
    100
  );

  //api functionality to search, filter, and sort product query
  const api = new APIFunctionality(Product.find(), req.query)
    .search()
    .filter()
    .sort();

  //required for frontend to calculate total pages before pagination
  const productCount = await api.query.clone().countDocuments();
  const totalPages = Math.ceil(productCount / resultsPerPage) || 1;
  const currentPage = Math.max(1, Number(req.query.page) || 1);

  //invalid pages check (eg total pages:2 , user ask 10 then return 404 error)
  if (currentPage > totalPages && productCount > 0) {
    return next(
      new HandleError(
        `Page ${currentPage} does not exist`,
        404
      )
    );
  }

  //pagination to give limited products for current page
  api.pagination(resultsPerPage);
  const products = await api.query;

  res.status(200).json({
    success: true,
    productCount,
    resultsPerPage,
    totalPages,
    currentPage,
    products,
  });
});

//getAll products fetches products with searching, filtering,sorting and pagination

// getSingleProduct using product ID or slug
// GET /api/v1/product/:id
export const getSingleProduct = handleAsyncError(async (req, res, next) => {
  const product = await findProduct(req.params.id);

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

//public-getFilterOptions(used for filter sidebar)
// GET /api/v1/filters
// Returns distinct categories, brands, genders, subcategories + price range parallely
export const getFilterOptions = handleAsyncError(async (req, res, next) => {
  //promise allow multiple independent database queries to run together in parallel
  const [categories, brands, subcategories, genders] = await Promise.all([
    Product.distinct("category"),
    Product.distinct("brand"),
    Product.distinct("subcategory"),
    Product.distinct("gender"),
  ]);

  //aggregation helps to find lowest price and highest price from db
  const priceAgg = await Product.aggregate([
    {
      $group: {
        _id: null,
        min: { $min: "$price" },
        max: { $max: "$price" },
      },
    },
  ]);

  const priceRange = priceAgg[0]
    ? { min: priceAgg[0].min, max: priceAgg[0].max }
    : { min: 0, max: 0 };

  res.status(200).json({
    success: true,
    categories,
    brands,
    subcategories: subcategories.filter(Boolean),
    genders,
    priceRange,
  });
});

//public- getProductReviews (retrieve all reviews of a particular product)
// GET /api/v1/reviews?id=<productId>
export const getProductReviews = handleAsyncError(async (req, res, next) => {
  //if no product id then return error
  if (!req.query.id) {
    return next(
      new HandleError(
        "Product ID is required as query param ?id=",
        400
      )
    );
  }

  //find product
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// AUTHENTICATED — CREATE OR UPDATE REVIEW only by authenticated user
// PUT /api/v1/review
// One review per user per product.
// Sending again updates the existing review.

export const createOrUpdateReview = handleAsyncError(
  async (req, res, next) => {
    const { rating, comment, productId } = req.body;

    if (!productId || !rating || !comment) {
      return next(
        new HandleError(
          "Product ID, rating and comment are required",
          400
        )
      );
    }

    //rating validation
    if (Number(rating) < 1 || Number(rating) > 5) {
      return next(
        new HandleError("Rating must be between 1 and 5", 400)
      );
    }

    const product = await findProduct(productId);

    if (!product) {
      return next(new HandleError("Product not found", 404));
    }

    //check if review has already been created
    const existingIndex = product.reviews.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    );

    //if there is exiting review it donot create new review but uodate it
    if (existingIndex >= 0) {
      product.reviews[existingIndex].rating = Number(rating);
      product.reviews[existingIndex].comment = comment;
    } else {
      product.reviews.push({
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
      });
    }

    // total reviews count update
    product.numOfReviews = product.reviews.length;

    //average rating calculation
    product.ratings =
      product.reviews.reduce((sum, r) => sum + r.rating, 0) /
      product.reviews.length;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Review submitted successfully",
    });
  }
);

// ADMIN FUNCTIONALITIES
// getAdminProducts (retrives all products for admin dashboard)
// GET /api/v1/admin/products

export const getAdminProducts = handleAsyncError(
  async (req, res, next) => {
    const products = await Product.find().sort("-createdAt");

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  }
);

// createProduct()-for admin
// POST /api/v1/admin/product/create
// image field: single base64 string OR array of base64 strings
// ─────────────────────────────────────────────────────────────────────────────
export const createProduct = handleAsyncError(async (req, res, next) => {
  const {
    name,
    description,
    price,
    category,
    brand,
    stock,
  } = req.body;

  if (
    !name ||
    !description ||
    !price ||
    !category ||
    !brand ||
    stock === undefined
  ) {
    return next(
      new HandleError(
        "Name, description, price, category, brand and stock are required",
        400
      )
    );
  }

  // Image input normalize
  let rawImages = [];

  if (req.body.image) {
    rawImages = Array.isArray(req.body.image)
      ? req.body.image
      : [req.body.image];
  }

  //upload image to cloudinary
  let imageLinks = [];

  if (rawImages.length > 0) {
    imageLinks = await uploadImages(rawImages);
  }

  //create product with user id
  const product = await Product.create({
    ...req.body,
    image: imageLinks,
    user: req.user._id,
  });

  res.status(201).json({
    success: true,
    product,
  });
});

// ADMIN — UPDATE PRODUCT(existing product update)
// PUT /api/v1/admin/product/:id

export const updateProduct = handleAsyncError(async (req, res, next) => {
  let product = await findProduct(req.params.id);

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }

  // If new images supplied → replace all existing ones
  let rawImages = [];

  if (req.body.image) {
    rawImages = Array.isArray(req.body.image)
      ? req.body.image
      : [req.body.image];
  }

  if (rawImages.length > 0) {
    await destroyImages(product.image);
    req.body.image = await uploadImages(rawImages);
  } else {
    // Keep existing images when none are supplied
    delete req.body.image;
  }

  //update product in mongodb
  product = await Product.findByIdAndUpdate(
    product._id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    product,
  });
});

// ADMIN — DELETE PRODUCT
// DELETE /api/v1/admin/product/:id
// first cloudinary image delete then product deletion from mongodb
export const deleteProduct = handleAsyncError(async (req, res, next) => {
  const product = await findProduct(req.params.id);

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }

  // Remove Cloudinary images before deleting the document
  await destroyImages(product.image);

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// AUTH — DELETE REVIEW
// DELETE /api/v1/reviews?productId=<id>&id=<reviewId>
// Admin can delete any review.
// User can only delete their own.

export const deleteReview = handleAsyncError(async (req, res, next) => {
  if (!req.query.productId || !req.query.id) {
    return next(
      new HandleError(
        "Both productId and review id are required as query params",
        400
      )
    );
  }

  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }

  const review = product.reviews.id(req.query.id);

  if (!review) {
    return next(new HandleError("Review not found", 404));
  }

  // Non-admin users may only delete their own reviews
  if (
    req.user.role !== "admin" &&
    review.user.toString() !== req.user._id.toString()
  ) {
    return next(
      new HandleError(
        "You are not allowed to delete this review",
        403
      )
    );
  }

  product.reviews = product.reviews.filter(
    (r) => r._id.toString() !== req.query.id
  );

  //update review count
  product.numOfReviews = product.reviews.length;

  //recalculation of average rating after deleting the review
  product.ratings =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length
      : 0;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});