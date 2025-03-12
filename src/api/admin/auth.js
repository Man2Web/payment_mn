const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/", async (req, res) => {
  const { error } = req.query;
  const form = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Admin Dashboard</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 400px;
            margin: 40px auto;
            padding: 20px;
          }
          .form-group {
            margin-bottom: 15px;
          }
          label {
            display: block;
            margin-bottom: 5px;
          }
          input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          button:hover {
            background-color: #45a049;
          }
          .error {
            color: red;
            margin-bottom: 15px;
          }
        </style>
      </head>
      <body>
        <h2>Redeem Points</h2>
        ${error ? `<p class="error">${error}</p>` : ""}
        <form action="/admin/auth/validate" method="POST">
          <div class="form-group">    
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required>
          </div>
          <button type="submit">Submit</button>
        </form>
      </body>
      </html>
    `;
  res.send(form);
});

router.post("/validate", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.redirect("/admin/auth?error=Email and password are required");
  const strapiURL = process.env.PLAIN_STRAPI_URL;
  try {
    const response = await axios.post(`${strapiURL}/admin/login`, {
      email,
      password,
    });
    if (response.status === 200 && response.data.data.token) {
      req.session.token = response.data.data.token;
      return res.redirect("/admin/dashboard");
    }
  } catch (error) {
    console.log(error.response.data);
    return res.redirect("/admin/auth?error=Error authenticating admin");
  }
});

module.exports = router;
