const axios = require("axios");
const qs = require("qs");

const getAuthToken = async () => {
  const url = process.env.AUTH_TOKEN_URL;
  const clientId = process.env.DEMO_CLIENT_ID;
  const clientSecret = process.env.DEMO_CLIENT_SECRET;
  const data = qs.stringify({
    client_id: clientId,
    client_version: "1",
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });
  try {
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const authToken = response.data.access_token;
    return authToken;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get Auth Token");
  }
};

module.exports = getAuthToken;
