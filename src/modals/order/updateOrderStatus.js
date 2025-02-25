const axios = require("axios");

const updateOrderStatus = async (transactionId) => {
  const STRAPI_SERVICE_TOKEN = process.env.STRAPI_SERVICE_TOKEN;
  try {
    const response = await axios.put(
      `${process.env.STRAPI_URL}/orders/${transactionId}`,
      { data: { orderStatus: true } },
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
