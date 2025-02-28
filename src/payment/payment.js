const express = require("express");
const { v4: uuidv4 } = require("uuid");
const checkUser = require("../modals/user/checkUser");
const checkUserCart = require("../modals/user/checkCart");
const axios = require("axios");
const getTransactionId = require("../modals/order/getTransactionId");
const updateOrderStatus = require("../modals/order/updateOrderStatus");
const updateCart = require("../modals/user/updateCart");
const getAuthToken = require("../modals/auth/getAuthToken");
const initiate = require("../modals/payment/initiate");

const router = express.Router();

router.post("/", async (req, res) => {
  const { user, products, userAddress } = req.body.data;
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = authHeader.split(" ")[1];
    await checkUser(token);
    const { totalPrice, productDetails } = await checkUserCart(products);
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
          products: sanitizedProducts,
          userAddress,
          user,
          transactionId,
          orderStatus: false,
        },
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const amount = Number(totalPrice.toFixed(2)); // Ensure this is a valid number
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
