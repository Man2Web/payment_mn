const axios = require("axios");

async function getDigitalMaterialsData() {
  try {
    const response = await axios.get(
      `${process.env.STRAPI_URL}/material-types`,
      {
        params: {
          populate: "*",
        },
      }
    );
    return response.data.data.filter(
      (material) => material.digitalOrder === true
    );
  } catch (error) {
    console.error("Error fetching material types:", error);
    return [];
  }
}

module.exports = getDigitalMaterialsData;
