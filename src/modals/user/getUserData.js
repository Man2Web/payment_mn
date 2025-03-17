const axios = require("axios");

async function getUserData(phone) {
  const token = process.env.STRAPI_SERVICE_TOKEN;
  try {
    const response = await axios.get(`${process.env.STRAPI_URL}/users`, {
      params: {
        "filters[username][$eq]": phone,
        "populate[digital_orders][populate][0]": "material_type",
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data[0]; // Return first user from array
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

module.exports = getUserData;
