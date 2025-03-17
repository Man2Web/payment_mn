const axios = require("axios");

async function findUserByPhone(phone) {
  try {
    const response = await axios.get(`${process.env.STRAPI_URL}/users`, {
      params: {
        "filters[username][$eq]": phone,
      },
    });
    return response.data[0];
  } catch (error) {
    console.error("Error finding user:", error);
    return null;
  }
}

module.exports = findUserByPhone;
