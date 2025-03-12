const axios = require("axios");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const response = await axios.get(
      `${process.env.STRAPI_URL}/users/me?populate=*`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.data || !response.data.confirmed || response.data.blocked) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Attach user data to request object
    req.user = response.data;
    next();
  } catch (error) {
    console.log(error);
    console.error("Error checking user:", error.message);
    if (error.response && error.response.status === 401) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = authMiddleware;
