const axios = require("axios");

const getMaterialData = async (materialTypeId) => {
  try {
    const response = await axios.get(
      `${process.env.STRAPI_URL}/material-types/${materialTypeId}`,
      {
        params: {
          populate: "*",
        },
      }
    );
    const { id, price, digitalOrder } = response.data.data;
    if (!digitalOrder || digitalOrder === null)
      throw new Error("Invalid Order");
    return { id, price };
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

module.exports = getMaterialData;
