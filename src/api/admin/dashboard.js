const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  const dashboard = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Admin Dashboard</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="/styles.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    </head>
    <body>
      <div class="sidebar">
        <h2>Admin Panel</h2>
        <ul class="nav-links">
          <li><a href="/admin/dashboard" class="active"><i class="fas fa-home"></i>Dashboard</a></li>
          <li><a href="/admin/reedem"><i class="fas fa-users"></i>Reedem</a></li>
        </ul>
      </div>

      <div class="main-content">
        <div class="dashboard-header">
          <h1>Dashboard Overview</h1>
        </div>

        <div class="dashboard-cards">
          <div class="card">
            <h3>Total Users</h3>
            <p>1,234</p>
          </div>
          <div class="card">
            <h3>Total Orders</h3>
            <p>456</p>
          </div>
          <div class="card">
            <h3>Revenue</h3>
            <p>$12,345</p>
          </div>
          <div class="card">
            <h3>Products</h3>
            <p>789</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  res.send(dashboard);
});

module.exports = router;
