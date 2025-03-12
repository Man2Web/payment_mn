const axios = require("axios");

const initiate = async (authToken, transactionId, amount, isDigitalOrder) => {
  const paymentUrl = process.env.PAYMENT_URL;
  const serverUrl = process.env.APP_BE_URL;
  try {
    if (isDigitalOrder) {
      const data = JSON.stringify({
        merchantOrderId: transactionId,
        amount: 100,
        paymentFlow: {
          type: "PG_CHECKOUT",
          message: "MN JEWEL PAYMENT",
          merchantUrls: {
            redirectUrl: `${serverUrl}/digital-orders/validate/${transactionId}`,
          },
        },
      });
      const response = await axios.post(paymentUrl, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${authToken}`,
        },
      });
      return response.data;
    } else {
      const data = JSON.stringify({
        merchantOrderId: transactionId,
        amount: 100,
        paymentFlow: {
          type: "PG_CHECKOUT",
          message: "MN JEWEL PAYMENT",
          merchantUrls: {
            redirectUrl: `${serverUrl}/payment/validate/${transactionId}`,
          },
        },
      });
      const response = await axios.post(paymentUrl, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${authToken}`,
        },
      });
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to initiate payment");
  }
};

module.exports = initiate;
