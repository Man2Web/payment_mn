const axios = require("axios");
const getAuthToken = require("../auth/getAuthToken");

const status = async (merchantTransactionId) => {
  const statusUrl = process.env.STATUS_URL;
  const authToken = await getAuthToken();
  try {
    const response = await axios.get(
      `${statusUrl}/${merchantTransactionId}/status`,
      {
        params: {
          details: false,
        },
        headers: {
          Authorization: `O-Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get Payment Status");
  }
};

module.exports = status;
