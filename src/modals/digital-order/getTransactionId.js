const axios = require("axios");

const getTransactionId = async (merchantTransactionId) => {
  const STRAPI_SERVICE_TOKEN = process.env.STRAPI_SERVICE_TOKEN;
  try {
    const response = await axios.get(
      `${process.env.STRAPI_URL}/digital-orders?filters[transactionId][$eq]=${merchantTransactionId}`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_SERVICE_TOKEN}`,
        },
      }
    );
    const { documentId: transactionId } = response.data.data[0];
    return transactionId;
  } catch (error) {
    console.error(error.message);
    throw new Error(error.message);
  }
};

module.exports = getTransactionId;
