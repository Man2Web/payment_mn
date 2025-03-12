const axios = require("axios");

const checkCoupon = async (coupon, productDetails) => {
  if (!coupon) return;
  const productIds = productDetails.map((data) => data.documentId);
  const categoryIds = productDetails.map((data) => data.categoryId);
  try {
    const response = await axios.get(
      `${process.env.STRAPI_URL}/coupons/${coupon.documentId}`,
      {
        params: {
          "filters[isActive][$eq]": true,
          "filters[startDate][$lte]": new Date(),
          "filters[endDate][$gte]": new Date(),
          populate: "*",
        },
      }
    );
    const couponProductIds = response.data.data.products.map(
      (data) => data.documentId
    );
    if (response.data.data.category) {
      const isCategoryEligible = categoryIds.includes(
        response.data.data.category.id
      );
      if (!isCategoryEligible)
        throw new Error("Category not eligible for coupon");
    }
    if (response.data.data.products.length > 0) {
      let isAvailable = false;
      for (let i = 0; i < productIds.length; i++) {
        for (let x = 0; x < couponProductIds.length; x++) {
          if (productIds[i] === couponProductIds[x]) isAvailable = true;
        }
      }
      if (!isAvailable) throw new Error("Product not eligible for coupon");
    }
    return response.data.data;
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
};

module.exports = checkCoupon;
