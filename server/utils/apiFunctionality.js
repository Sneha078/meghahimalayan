//Handles product search, filterin, sorting and pagination 
//class is created to make it reusable to other APIs
class APIFunctionality {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // function for product search (based on name, brand and description)
  search() {
    if (this.queryString.keyword) {
      //regex(check whether text follows a specific format)
      const regex = { $regex: this.queryString.keyword, $options: "i" };
      this.query = this.query.find({
        $or: [{ name: regex }, { brand: regex }, { description: regex }],
      });
    }
    return this;
  }

  // filtering
  filter() {
    const queryCopy = { ...this.queryString };

    // Strip pagination / sort / search keys before building filter
    const reserved = [
      "keyword", "page", "limit", "sort",
      "category", "brand", "gender",
      "minPrice", "maxPrice",
      "inStock", "discount", "featured", "bestSeller", "new",
    ];
    reserved.forEach((k) => delete queryCopy[k]);

    // Convert Mongoose operator syntax: gt → $gt etc.
    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (m) => `$${m}`);
    const filters = JSON.parse(queryStr);

    // Category  — single value
    if (this.queryString.category) {
      filters.category = this.queryString.category;
    }

    // Brand  — supports comma-separated list: ?brand=Ray-Ban,Oakley
    if (this.queryString.brand) {
      const brands = this.queryString.brand.split(",").map((b) => b.trim());
      filters.brand = { $in: brands };
    }

    // Gender  — supports comma-separated list: ?gender=Men,Unisex
    if (this.queryString.gender) {
      const genders = this.queryString.gender.split(",").map((g) => g.trim());
      filters.gender = { $in: genders };
    }

    // Price range  — ?minPrice=500&maxPrice=5000
    if (this.queryString.minPrice || this.queryString.maxPrice) {
      filters.price = {};
      if (this.queryString.minPrice)
        filters.price.$gte = Number(this.queryString.minPrice);
      if (this.queryString.maxPrice)
        filters.price.$lte = Number(this.queryString.maxPrice);
    }

    // Stock availability  — ?inStock=true
    if (this.queryString.inStock === "true") {
      filters.stock = { $gt: 0 };
    }

    // On sale / has discount  — ?discount=true
    if (this.queryString.discount === "true") {
      filters.discountPrice = { $exists: true, $ne: null, $gt: 0 };
    }

    // Collection flags
    if (this.queryString.featured === "true")   filters.isFeatured    = true;
    if (this.queryString.bestSeller === "true") filters.isBestSeller  = true;
    if (this.queryString.new === "true")        filters.isNewArrival  = true;

    this.query = this.query.find(filters);
    return this;
  }

  // ─── Sorting ──────────────────────────────────────────────────────────────
  // ?sort=price-low | price-high | rating | newest | best-selling | name
  sort() {
    const sortMap = {
      "price-low":    "price",
      "price-high":   "-price",
      "rating":       "-ratings",   // schema field is "ratings" (plural)
      "newest":       "-createdAt",
      "best-selling": "-isBestSeller -ratings",
      "name":         "name",
    };

    if (this.queryString.sort) {
      const mapped = sortMap[this.queryString.sort] || "-createdAt";
      this.query = this.query.sort(mapped);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  // ─── Pagination ───────────────────────────────────────────────────────────
  // ?page=1&limit=12
  pagination(resultsPerPage) {
    const currentPage = Math.max(1, Number(this.queryString.page) || 1);
    const skip = resultsPerPage * (currentPage - 1);
    this.query = this.query.limit(resultsPerPage).skip(skip);
    return this;
  }
}

export default APIFunctionality;
