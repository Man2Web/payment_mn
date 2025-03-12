const axios = require("axios");

const updateOrderStatus = async (transactionId, status) => {
  const STRAPI_SERVICE_TOKEN = process.env.STRAPI_SERVICE_TOKEN;
  try {
    const response = await axios.put(
      `${process.env.STRAPI_URL}/digital-orders/${transactionId}`,
      { data: { paymentStatus: status } },
      {
        headers: {
          Authorization: `Bearer ${STRAPI_SERVICE_TOKEN}`,
        },
      }
    );
    const { documentId: orderId } = response.data.data;
    return orderId;
  } catch (error) {
    console.error(error.message);
    throw new Error(error.message);
  }
};

module.exports = updateOrderStatus;
