const express = require("express");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();
const axios = require("axios");
const getMaterialData = require("../../modals/material/getMaterialData");
const getAuthToken = require("../../modals/auth/getAuthToken");
const initiate = require("../../modals/payment/initiate");

router.post("/", async (req, res) => {
  const { user, materialType, grams } = req.body;
  const token = process.env.STRAPI_SERVICE_TOKEN;
  const transactionId = uuidv4().substring(0, 8);
  if (!user || !materialType || !grams || req.user.id !== user)
    return res.status(401).json({ message: "Unauthorized" });

  try {
    const { id, price } = await getMaterialData(materialType);
    const amount = parseFloat((grams * price).toFixed(2));
    console.log(amount, price);
    axios.post(
      `${process.env.STRAPI_URL}/digital-orders`,
      {
        data: {
          user,
          grams,
          orderPrice: amount,
          goldPrice: price,
          paymentStatus: "Failed",
          transactionType: "Credit",
          material_type: id,
          transactionId,
        },
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const authToken = await getAuthToken();
    const data = await initiate(authToken, transactionId, amount, true);
    return res.json({ ...data });
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
