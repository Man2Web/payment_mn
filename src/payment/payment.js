const express = require("express");
const { v4: uuidv4 } = require("uuid");
const checkUser = require("../modals/user/checkUser");
const checkUserCart = require("../modals/user/checkCart");
const axios = require("axios");
const sha256 = require("sha256");
const getTransactionId = require("../modals/order/getTransactionId");
const updateOrderStatus = require("../modals/order/updateOrderStatus");
const updateCart = require("../modals/user/updateCart");

const router = express.Router();

// UAT environment
const MERCHANT_ID = process.env.DEMO_MERCHANT_ID; // Set this properly
const PHONE_PE_HOST_URL = process.env.PHONE_PE_URL;
const SALT_INDEX = 1;
const SALT_KEY = process.env.DEMO_SALT_KEY; // Set this properly
const APP_BE_URL = process.env.BACKEND_URL; // Your backend
const WEBSITE_URL = process.env.WEBSITE_URL; // Your website

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
    let userId = "MUID123";
    let merchantTransactionId = transactionId;

    let normalPayLoad = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: userId,
      amount: amount * 100, // Converting to paise
      redirectUrl: `${APP_BE_URL}/payment/validate/${merchantTransactionId}`,
      redirectMode: "REDIRECT",
      mobileNumber: userAddress.phoneNumber,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    // Make base64 encoded payload
    let base64EncodedPayload = Buffer.from(
      JSON.stringify(normalPayLoad),
      "utf8"
    ).toString("base64");

    // Compute X-VERIFY hash
    let stringToHash = base64EncodedPayload + "/pg/v1/pay" + SALT_KEY;
    let sha256_val = sha256(stringToHash);
    let xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

    try {
      let response = await axios.post(
        `${PHONE_PE_HOST_URL}/pg/v1/pay`,
        { request: base64EncodedPayload },
        {
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": xVerifyChecksum,
            "X-MERCHANT-ID": MERCHANT_ID,
            Accept: "application/json",
          },
        }
      );
      res
        .status(200)
        .json({ url: response.data.data.instrumentResponse.redirectInfo.url });
    } catch (error) {
      console.log(error.response);
      console.error(
        "PhonePe API Error:",
        error.response ? error.response.data : error
      );
      res
        .status(error.response?.status || 500)
        .json(error.response?.data || { message: "Unknown error" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message });
  }
});

router.get("/validate/:merchantTransactionId", async function (req, res) {
  const { merchantTransactionId } = req.params;
  if (!merchantTransactionId)
    return res.status(400).send("Invalid Transaction ID");

  let statusUrl = `${PHONE_PE_HOST_URL}/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`;

  // Compute X-VERIFY for status check
  let stringToHash = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}${SALT_KEY}`;
  let sha256_val = sha256(stringToHash);
  let xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

  try {
    let response = await axios.get(statusUrl, {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerifyChecksum,
        "X-MERCHANT-ID": MERCHANT_ID,
        Accept: "application/json",
      },
    });

    if (response.data && response.data.code === "PAYMENT_SUCCESS") {
      const transactionId = await getTransactionId(merchantTransactionId);
      const orderId = await updateOrderStatus(transactionId);
      await updateCart(orderId);
      res.redirect(`${WEBSITE_URL}/bookingconfirmation`);
    } else {
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
    res
      .status(error.response?.status || 500)
      .json(
        error.response?.data || { message: "Error checking payment status" }
      );
  }
});

module.exports = router;
