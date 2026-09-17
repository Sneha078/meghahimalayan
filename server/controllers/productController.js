import Product from "../models/productModel.js";
import HandleError from "../utils/handleError.js"; //application error handle
import handleAsyncError from "../middleware/handleAsyncError.js"; //asynchronous error handle
import APIFunctionality from "../utils/apiFunctionality.js"; //Product search/filter/sort/pagination ko common logic handle garcha.
import cloudinary from "../config/cloudinary.js"; //product images upload/del in cloudinary


// Helper functions

// Product lookup by ObjectId or slug
const findProduct = async (id) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  return isObjectId ? Product.findById(id) : Product.findOne({ slug: id });
};

// Unified async concurrent media upload
const uploadMedia = async (files, resourceType = "image", folder = "products") => {
  if (!Array.isArray(files) || files.length === 0) return [];

  const uploadPromises = files.map((file) =>
    cloudinary.uploader.upload(file, {
      folder,
      resource_type: resourceType,
    })
  );

  const results = await Promise.all(uploadPromises);
  return results.map((result) => ({
    public_id: result.public_id,
    url: result.secure_url,
  }));
};

// Unified async concurrent media destruction
const destroyMedia = async (items, resourceType = "image") => {
  if (!Array.isArray(items) || items.length === 0) return;

  const destroyPromises = items
    .filter((item) => item && item.public_id)
    .map((item) =>
      cloudinary.uploader.destroy(item.public_id, {
        resource_type: resourceType,
      })
    );

  await Promise.all(destroyPromises);
};

// Aliases for backward compatibility in existing handlers
const uploadImages = (images) => uploadMedia(images, "image", "products");
const destroyImages = (images) => destroyMedia(images, "image");

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
// GET /api/v1/filters?category=eyeglasses
// Returns distinct categories, brands, genders, subcategories + price range parallely
// When a category is passed, brand/subcategory/gender are scoped to that
// category only — "categories" itself always stays global so the tab list
// never shrinks when you're already filtered into one category.
export const getFilterOptions = handleAsyncError(async (req, res, next) => {
  const categoryFilter = req.query.category ? { category: req.query.category } : {};

  //promise allow multiple independent database queries to run together in parallel
  const [categories, brands, subcategories, genders] = await Promise.all([
    Product.distinct("category"),
    Product.distinct("brand", categoryFilter),
    Product.distinct("subcategory", categoryFilter),
    Product.distinct("gender", categoryFilter),
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

    //NEW: count products per category
    const categoryCountsAgg = await Product.aggregate([
      { $group: {_id: "$category", count: {$sum: 1}}},
    ])

    const categoryCounts = categoryCountsAgg.reduce((acc, c) =>{
      acc[c._id] = c.count
      return acc
    }, {})

  res.status(200).json({
    success: true,
    categories,
    categoryCounts,
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
//
// Media handling on update: images/videos are always fully replaced with
// whatever was submitted this time (which may be an empty array). Any
// previously stored media that isn't in the new submission is destroyed on
// Cloudinary. This means editing a review without re-attaching photos or
// video will delete the old ones — that's intentional, not a bug: the
// frontend treats "submit with no files" as "no photos/video on this
// review" rather than "leave them alone".

export const createOrUpdateReview = handleAsyncError(
  async (req, res, next) => {
    const { rating, comment, productId, images, videos } = req.body;

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

    // Always resolve to a concrete array (possibly empty) — this makes the
    // update branch below a real "replace with whatever was submitted"
    // instead of "replace only if something non-empty was submitted".
    let imageLinks = [];
    let videoLinks = [];
    
    try {
      imageLinks = Array.isArray(images) && images.length > 0
        ? await uploadMedia(images, "image", "reviews/images")
        : [];
      
      videoLinks = Array.isArray(videos) && videos.length > 0
        ? await uploadMedia(videos, "video", "reviews/videos")
        : [];
    } catch (uploadError) {
      return next(new HandleError(`Failed to upload media: ${uploadError.message}`, 400));
    }

    //check if review has already been created
    const existingIndex = product.reviews.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    );

    //if there is exiting review it donot create new review but uodate it
    if (existingIndex >= 0) {
      const existing = product.reviews[existingIndex];
      existing.rating = Number(rating)
      existing.comment = comment

      // Full replace on every edit: destroy whatever old media existed,
      // then set the new (possibly empty) set. Submitting with nothing
      // attached clears photos/video from the review.
      await destroyMedia(existing.images || [], "image")
      existing.images = imageLinks

      await destroyMedia(existing.videos || [], "video")
      existing.videos = videoLinks
    } else {
      product.reviews.push({
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
        images: imageLinks,
        videos: videoLinks
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

  //update product in momgodb
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
  await destroyMedia(review.images || [], "image")
  await destroyMedia(review.videos || [], "video")

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