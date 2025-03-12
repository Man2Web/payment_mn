const express = require("express");
const status = require("../../modals/payment/status");
const getTransactionId = require("../../modals/digital-order/getTransactionId");
const updateOrderStatus = require("../../modals/digital-order/updateOrderStatus");

const router = express.Router();

router.get("/:merchantTransactionId", async function (req, res) {
  const { merchantTransactionId } = req.params;
  if (!merchantTransactionId)
    return res.status(400).send("Invalid Transaction ID");
  const WEBSITE_URL = process.env.WEBSITE_URL;
  try {
    const data = await status(merchantTransactionId);
    const { state } = data;
    const transactionId = await getTransactionId(merchantTransactionId);
    if (data && state === "COMPLETED") {
      await updateOrderStatus(transactionId, "Success");
    } else {
      await updateOrderStatus(transactionId, "Failure");
    }
    return res.redirect(`${WEBSITE_URL}/wallet`);
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
