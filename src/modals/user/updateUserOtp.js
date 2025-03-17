const axios = require("axios");

async function updateUserOTP(userId, otp) {
  try {
    const response = await axios.put(
      `${process.env.STRAPI_URL}/users/${userId}`,
      {
        tOtp: otp,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.STRAPI_SERVICE_TOKEN}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating user OTP:", error);
    return null;
  }
}

module.exports = updateUserOTP;
