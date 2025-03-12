const express = require("express");
const { v4: uuidv4 } = require("uuid");
const checkUserCart = require("../../modals/user/checkCart");
const axios = require("axios");
const getAuthToken = require("../../modals/auth/getAuthToken");
const initiate = require("../../modals/payment/initiate");
const checkCoupon = require("../../modals/coupon/checkCoupon");
const calculateDiscount = require("../../modals/coupon/calculateDiscount");

const router = express.Router();

router.post("/", async (req, res) => {
  const { user, products, userAddress, userSelectedCoupon } = req.body.data;
  const token = process.env.STRAPI_SERVICE_TOKEN;
  try {
    const { totalPrice, productDetails } = await checkUserCart(products);
    const couponData = await checkCoupon(userSelectedCoupon, productDetails);
    const discountResult = await calculateDiscount(couponData, totalPrice);
    const discountAmount =
      typeof discountResult === "number" ? 0 : discountResult.discountAmount;
    const transactionId = uuidv4().substring(0, 8);
    if (!user || !productDetails || !userAddress) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const sanitizedProducts = productDetails.map(
      ({ documentId, ...rest }) => rest
    );
    // Save order in Strapi
    await axios.post(
      `${process.env.STRAPI_URL}/orders`,
      {
        data: {
          totalPrice,
          discountAmount,
          products: sanitizedProducts,
          userAddress,
          user,
          transactionId,
          orderStatus: false,
          coupon: userSelectedCoupon?.id,
        },
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const amount = Number((totalPrice - discountAmount).toFixed(2));
    const authToken = await getAuthToken();
    const data = await initiate(authToken, transactionId, amount);
    res.json({ ...data });
  } catch (error) {
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message });
  }
});

module.exports = router;
