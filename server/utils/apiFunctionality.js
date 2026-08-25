// Handles product search, filtering, sorting and pagination
// class is created to make it reusable to other APIs
class APIFunctionality {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // Function for product search (based on name, brand and description)
  search() {
    if (this.queryString.keyword) {
      // regex (check whether text follows a specific format)
      const regex = {
        $regex: this.queryString.keyword,
        $options: "i",
      };

      this.query = this.query.find({
        $or: [
          { name: regex },
          { brand: regex },
          { description: regex },
        ],
      });
    }

    return this;
  }

  // Filtering
  filter() {
    const queryCopy = { ...this.queryString };

    // Parameters that need special handling
    const reserved = [
      "keyword",
      "page",
      "limit",
      "sort",
      "category",
      "brand",
      "gender",
      "minPrice",
      "maxPrice",
      "inStock",
      "discount",
      "featured",
      "bestSeller",
      "new",
    ];

    reserved.forEach((k) => delete queryCopy[k]);

    // Convert JavaScript object into string
    let queryStr = JSON.stringify(queryCopy);

    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte)\b/g,
      (m) => `$${m}`
    );

    const filters = JSON.parse(queryStr);

    // Category filter
    if (this.queryString.category) {
      filters.category = this.queryString.category;
    }

    // Brand filter
    if (this.queryString.brand) {
      const brands = this.queryString.brand
        .split(",")
        .map((b) => b.trim());

      filters.brand = { $in: brands };
    }

    // Gender filter
    if (this.queryString.gender) {
      const genders = this.queryString.gender
        .split(",")
        .map((g) => g.trim());

      filters.gender = { $in: genders };
    }

    // Price range filtering
    if (this.queryString.minPrice || this.queryString.maxPrice) {
      filters.price = {};

      if (this.queryString.minPrice)
        filters.price.$gte = Number(this.queryString.minPrice);

      if (this.queryString.maxPrice)
        filters.price.$lte = Number(this.queryString.maxPrice);
    }

    // Stock availability
    if (this.queryString.inStock === "true") {
      filters.stock = { $gt: 0 };
    }

    // Discount filtering
    if (this.queryString.discount === "true") {
      filters.discountPrice = {
        $exists: true,
        $ne: null,
        $gt: 0,
      };
    }

    // Featured products
    if (this.queryString.featured === "true")
      filters.isFeatured = true;

    // Best sellers
    if (this.queryString.bestSeller === "true")
      filters.isBestSeller = true;

    // New arrivals
    if (this.queryString.new === "true")
      filters.isNewArrival = true;

    // Apply filters
    this.query = this.query.find(filters);

    return this;
  }

  // Sorting
  sort() {
    const sortMap = {
      "price-low": "price",
      "price-high": "-price",
      "rating": "-ratings",
      "newest": "-createdAt",
      "best-selling": "-isBestSeller -ratings",
      "name": "name",
    };

    // Apply sorting
    if (this.queryString.sort) {
      const mapped =
        sortMap[this.queryString.sort] || "-createdAt";

      this.query = this.query.sort(mapped);
    } else {
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  // Pagination
  // default 12 products per page
  pagination(resultsPerPage) {
    const currentPage = Math.max(
      1,
      Number(this.queryString.page) || 1
    );

    const skip = resultsPerPage * (currentPage - 1);

    this.query = this.query
      .limit(resultsPerPage)
      .skip(skip);

    return this;
  }
}

export default APIFunctionality;