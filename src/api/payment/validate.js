const express = require("express");
const status = require("../../modals/payment/status");
const getTransactionId = require("../../modals/order/getTransactionId");
const updateOrderStatus = require("../../modals/order/updateOrderStatus");
const updateCart = require("../../modals/user/updateCart");

const router = express.Router();

router.get("/:merchantTransactionId", async function (req, res) {
  const { merchantTransactionId } = req.params;
  if (!merchantTransactionId)
    return res.status(400).send("Invalid Transaction ID");
  const WEBSITE_URL = process.env.WEBSITE_URL;
  try {
    const data = await status(merchantTransactionId);
    const { state } = data;
    if (data && state === "COMPLETED") {
      const transactionId = await getTransactionId(merchantTransactionId);
      const orderId = await updateOrderStatus(transactionId);
      await updateCart(orderId);
      res.redirect(`${WEBSITE_URL}/bookingsuccess`);
    } else {
      res.redirect(`${WEBSITE_URL}/bookingfailed`);
      res.json({
        success: false,
        status: "Payment Pending or Failed",
        data: response.data,
      });
    }
  } catch (error) {
    console.error(
      "Payment Status Check Error:",
      error.response ? error.response.data : error
    );
    return res
      .status(error.response?.status || 500)
      .json(
        error.response?.data || { message: "Error checking payment status" }
      );
  }
});

module.exports = router;
