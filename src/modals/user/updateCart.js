const axios = require("axios");

const updateCart = async (orderId) => {
  try {
    const response = await axios.get(
      `${process.env.STRAPI_URL}/orders/${orderId}?populate[products][populate]=*&populate[userAddress]=*&populate[user][populate]=*`,
      {
        headers: {
          Authorization: `Bearer ${process.env.STRAPI_SERVICE_TOKEN}`,
        },
      }
    );
    const { id } = response.data.data.user;
    await axios.put(
      `${process.env.STRAPI_URL}/users/${id}`,
      {
        userCart: [],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.STRAPI_SERVICE_TOKEN}`,
        },
      }
    );
  } catch (error) {
    console.error("Error updating cart:", error.message);
    throw new Error(error.message);
  }
};

module.exports = updateCart;
