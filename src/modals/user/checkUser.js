const axios = require("axios");

const checkUser = async (token) => {
  try {
    const response = await axios.get(
      `${process.env.STRAPI_URL}/users/me?populate=*`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (
      !response.data ||
      !response.data.confirmed ||
      response.data.blocked ||
      response.data.userCart.length === 0
    ) {
      const error = new Error("Unauthorized");
      error.statusCode = 401;
      throw error;
    }

    return response.data;
  } catch (error) {
    console.error("Error checking user:", error.message);
    if (error.response && error.response.status === 401) {
      const unauthorizedError = new Error("Unauthorized");
      unauthorizedError.statusCode = 401;
      throw unauthorizedError;
    }
    error.statusCode = error.statusCode || 500;
    throw error;
  }
};

module.exports = checkUser;
