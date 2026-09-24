import Product from "../models/productModel.js";
import HandleError from "../utils/handleError.js"; //application error handle
import handleAsyncError from "../middleware/handleAsyncError.js"; //asynchronous error handle
import APIFunctionality from "../utils/apiFunctionality.js"; //Product search/filter/sort/pagination ko common logic handle garcha.
import cloudinary from "../config/cloudinary.js"; //product images upload/del in cloudinary
import { awardReviewPoints, clawbackReviewPoints } from "../services/pointsService.js"; //reward points for reviews


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
      // Create new review
      const newReview = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
        images: imageLinks,
        videos: videoLinks
      };
      
      product.reviews.push(newReview);

      // Award points for new review (not for updates)
      try {
        const hasMedia = imageLinks.length > 0 || videoLinks.length > 0;
        await awardReviewPoints(req.user._id, newReview._id, hasMedia);
      } catch (pointsError) {
        console.error('Failed to award review points:', pointsError.message);
        // Don't fail the whole review creation if points award fails
      }
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


  // Variant(optional) - each carries its own base64 images
  let variantLinks = []
  if(Array.isArray(req.body.variants) && req.body.variants.length > 0){
    variantLinks = await uploadVariants(req.body.variants)
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
//
// Images are now additive, not a wholesale replace: `existingImages` tells
// the server which of the product's current photos the admin wants to
// KEEP (anything currently stored but absent from this list gets
// destroyed on Cloudinary and removed); `image` carries new base64 photos
// to upload and append on top of whatever's kept. Sending an empty
// `image` array with a full `existingImages` list is a pure no-op on
// photos; sending a shorter `existingImages` list is how an admin removes
// specific photos without touching the rest.
export const updateProduct = handleAsyncError(async (req, res, next) => {
  let product = await findProduct(req.params.id);

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }

  // New images to upload (base64)
  let rawNewImages = [];

  if (req.body.image) {
    rawNewImages = Array.isArray(req.body.image)
      ? req.body.image
      : [req.body.image];
  }

  // Only process image changes at all if the request actually included
  // either field — an admin form that doesn't touch images shouldn't
  // wipe them by omission.
  if (req.body.image !== undefined || req.body.existingImages !== undefined) {
    // If existingImages is provided, use it; otherwise keep all existing images
    // This handles the case where new images are added but existingImages isn't properly sent
    let keepList;
    if (req.body.existingImages !== undefined) {
      keepList = Array.isArray(req.body.existingImages) ? req.body.existingImages : [];
    } else if (req.body.image !== undefined) {
      // If only new images are being added and no existingImages specified, keep all existing
      keepList = product.image;
    } else {
      keepList = product.image;
    }

    const keepIds = new Set(
      keepList.map((img) => img.public_id).filter(Boolean)
    );

    const toDestroy = product.image.filter(
      (img) => img.public_id && !keepIds.has(img.public_id)
    );

    const keptImages = product.image.filter(
      (img) => !img.public_id || keepIds.has(img.public_id)
    );

    if (toDestroy.length > 0) {
      await destroyImages(toDestroy);
    }

    let uploadedImages = [];

    if (rawNewImages.length > 0) {
      uploadedImages = await uploadImages(rawNewImages);
    }

    req.body.image = [...keptImages, ...uploadedImages];
  } else {
    // Neither field present at all — leave images untouched.
    delete req.body.image;
  }

  delete req.body.existingImages; // not a schema field, don't pass through

  // Handle variants with image preservation
  if (req.body.variants !== undefined) {
    const updatedVariants = await Promise.all(
      req.body.variants.map(async (variant) => {
        // For existing variants, preserve images unless explicitly changed
        const existingVariant = product.variants.find(v => v._id && v._id.toString() === variant._id);
        
        let finalImages = [];
        
        if (existingVariant) {
          // Keep existing images that weren't explicitly removed
          const keepList = Array.isArray(variant.existingImages) 
            ? variant.existingImages 
            : existingVariant.images;
          
          const keepIds = new Set(
            keepList.map((img) => img.public_id).filter(Boolean)
          );

          const toDestroy = existingVariant.images.filter(
            (img) => img.public_id && !keepIds.has(img.public_id)
          );

          const keptImages = existingVariant.images.filter(
            (img) => !img.public_id || keepIds.has(img.public_id)
          );

          // Destroy removed images
          if (toDestroy.length > 0) {
            await destroyMedia(toDestroy, "image");
          }

          // Upload new images
          let uploadedImages = [];
          if (Array.isArray(variant.images) && variant.images.length > 0) {
            uploadedImages = await uploadMedia(variant.images, "image", "products/variants");
          }

          finalImages = [...keptImages, ...uploadedImages];
        } else {
          // New variant - just upload the images
          finalImages = Array.isArray(variant.images) && variant.images.length > 0
            ? await uploadMedia(variant.images, "image", "products/variants")
            : [];
        }

        // Remove the raw images and existingImages from the variant data
        const { images: _, existingImages: __, ...variantData } = variant;
        
        return {
          ...variantData,
          images: finalImages,
          stock: Number(variantData.stock) || 0,
          priceDelta: Number(variantData.priceDelta) || 0,
        };
      })
    );
    
    req.body.variants = updatedVariants;
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
  await destroyVariants(product.variants);
  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// Variant images: each variant carries its own base64 image array in the
// request body, gets uploaded to its own Cloudinary folder, and comes back
// with the same {public_id, url} shape as the top-level product images.
const uploadVariants = async (variants) => {
  if (!Array.isArray(variants) || variants.length === 0) return [];

  return Promise.all(
    variants.map(async (variant) => {
      const rawImages = Array.isArray(variant.images) ? variant.images : [];
      const imageLinks =
        rawImages.length > 0
          ? await uploadMedia(rawImages, "image", "products/variants")
          : [];

      return {
        color: variant.color,
        colorHex: variant.colorHex || "",
        images: imageLinks,
        stock: Number(variant.stock) || 0,
        sku: variant.sku || "",
        priceDelta: Number(variant.priceDelta) || 0,
      };
    })
  );
};

const destroyVariants = async (variants) => {
  if (!Array.isArray(variants) || variants.length === 0) return;

  await Promise.all(
    variants.map((variant) => destroyMedia(variant.images || [], "image"))
  );
};

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

  // Clawback points for this review before deleting it
  try {
    await clawbackReviewPoints(req.query.id);
  } catch (pointsError) {
    console.error('Failed to clawback review points:', pointsError.message);
    // Don't fail the whole review deletion if points clawback fails
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