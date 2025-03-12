const express = require("express");
const router = express.Router();
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

// Add OTP storage (in-memory)
const otpStore = new Map();

// Add OTP generation function
function generateOTP() {
  return uuidv4().substring(0, 6).toUpperCase();
}

// Add OTP validation function
function validateOTP(phone, otp) {
  const storedOTP = otpStore.get(phone);
  if (!storedOTP) return false;

  // Remove OTP after checking (one-time use)
  otpStore.delete(phone);
  return storedOTP === otp;
}

// Update getUserData function to use phone number instead of token
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
    console.log(response.data);
    return response.data[0]; // Return first user from array
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

// Add function to fetch material types
async function getMaterialTypes() {
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

// Update balance calculation function
function calculateBalancesByMaterial(orders, materials) {
  const balances = {};

  // Initialize balances for each material type
  materials.forEach((material) => {
    balances[material.material_type] = {
      name: material.name,
      credit: 0,
      debit: 0,
      invested: 0,
      currentBalance: 0,
      currentPrice: material.price,
    };
  });

  // Calculate balances
  orders?.forEach((order) => {
    if (order.paymentStatus === "Success") {
      const materialType = order.material_type.material_type;
      if (balances[materialType]) {
        if (order.transactionType === "Credit") {
          balances[materialType].credit += order.grams;
          balances[materialType].invested += order.orderPrice;
        } else if (order.transactionType === "Debit") {
          balances[materialType].debit += order.grams;
          balances[materialType].invested -= order.orderPrice;
        }
      }
    }
  });

  // Calculate current balance for each material
  Object.keys(balances).forEach((key) => {
    balances[key].currentBalance = balances[key].credit - balances[key].debit;
  });

  return balances;
}

// Add redemption validation function
function validateRedemption(balance, amount) {
  return balance >= amount;
}

// Add function to find user by phone
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

// Add function to update user's OTP
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

// Modify the router.get("/") handler to use phone instead of token
router.get("/", async (req, res) => {
  const errorMessage = req.query.error;
  let userData = null;
  let materialTypes = [];
  let showOTPForm = req.session.pendingPhone;

  if (req.session.userPhone) {
    // Changed from userToken to userPhone
    userData = await getUserData(req.session.userPhone);
    materialTypes = await getMaterialTypes();
  }
  console.log(userData);
  const authContent = `
    <div class="main-content">
      <div class="dashboard-header">
        <h1>User Authentication</h1>
      </div>

      <div class="auth-form">
        <div id="message" style="display: ${
          errorMessage ? "block" : "none"
        };" class="message error">
          ${errorMessage || ""}
        </div>
        ${
          showOTPForm
            ? `
          <form id="otpForm" method="POST" action="/admin/reedem/verify-otp">
            <div class="form-group">
              <label for="otp">Enter OTP sent to ${req.session.pendingPhone}:</label>
              <input type="text" id="otp" name="otp" maxlength="6" required>
            </div>
            <button type="submit" class="submit-btn">Verify OTP</button>
          </form>
        `
            : `
          <form id="phoneForm" method="POST" action="/admin/reedem/generate-otp">
            <div class="form-group">
              <label for="phone">User's Phone Number:</label>
              <input type="tel" id="phone" name="phone" required>
            </div>
            <button type="submit" class="submit-btn">Generate OTP</button>
          </form>
        `
        }
      </div>
    </div>
  `;

  const userContent = `
    <div class="main-content">
      <div class="dashboard-header">
        <h1>User Dashboard</h1>
      </div>
      ${
        errorMessage
          ? `
        <div class="message error">
          ${decodeURIComponent(errorMessage)}
        </div>
      `
          : ""
      }
      <div class="user-dashboard">
        <div class="user-info">
          <h2>User Details</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Username:</span>
              <span class="value">${userData?.username || "N/A"}</span>
            </div>
            <div class="info-item">
              <span class="label">Email:</span>
              <span class="value">${userData?.email || "N/A"}</span>
            </div>
          </div>

          ${(() => {
            if (userData?.digital_orders && materialTypes.length > 0) {
              const balances = calculateBalancesByMaterial(
                userData.digital_orders,
                materialTypes
              );
              return `
                ${Object.entries(balances)
                  .map(
                    ([materialType, balance]) => `
                    <div class="balance-summary">
                      <h3>${balance.name} Balance Summary</h3>
                      <div class="balance-grid">
                        <div class="balance-item">
                          <span class="label">Total Credited:</span>
                          <span class="value">${balance.credit.toFixed(
                            3
                          )} g</span>
                        </div>
                        <div class="balance-item">
                          <span class="label">Total Debited:</span>
                          <span class="value">${balance.debit.toFixed(
                            3
                          )} g</span>
                        </div>
                        <div class="balance-item">
                          <span class="label">Current Balance:</span>
                          <span class="value highlight">${balance.currentBalance.toFixed(
                            3
                          )} g</span>
                        </div>
                        <div class="balance-item">
                          <span class="label">Total Invested:</span>
                          <span class="value">₹${balance.invested.toFixed(
                            2
                          )}</span>
                        </div>
                        <div class="balance-item">
                          <span class="label">Current Value:</span>
                          <span class="value">₹${(
                            balance.currentBalance * balance.currentPrice
                          ).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  `
                  )
                  .join("")}
                
                <div class="redemption-section">
                  <h2>Redeem Materials</h2>
                  <form class="redemption-form" method="POST" action="/admin/reedem/redeem">
                    <div class="form-group">
                      <label for="material_type">Select Material:</label>
                      <select id="material_type" name="material_type" required>
                        ${Object.entries(balances)
                          .map(
                            ([type, balance]) => `
                            <option value="${type}" data-balance="${
                              balance.currentBalance
                            }">
                              ${
                                balance.name
                              } (Available: ${balance.currentBalance.toFixed(
                              3
                            )}g)
                            </option>
                          `
                          )
                          .join("")}
                      </select>
                    </div>
                    <div class="form-group">
                      <label for="amount">Amount (in grams):</label>
                      <input type="number" id="amount" name="amount" step="0.001" min="0.001" required>
                    </div>
                    <button type="submit" class="submit-btn">Redeem</button>
                  </form>
                </div>
              `;
            }
            return "";
          })()}
        </div>

        <div class="transactions">
          <h2>Transaction History</h2>
          <div class="transaction-list">
            ${
              userData?.digital_orders
                ?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                ?.map(
                  (order) => `
              <div class="transaction-item ${order.transactionType.toLowerCase()} ${order.paymentStatus.toLowerCase()}">
                <div class="transaction-details">
                  <div class="transaction-header">
                    <span class="transaction-id">#${order.transactionId}</span>
                    <span class="transaction-date">${new Date(
                      order.createdAt
                    ).toLocaleDateString()}</span>
                  </div>
                  <div class="transaction-body">
                    <span class="material-type">${
                      order.material_type.name
                    }</span>
                    <span class="grams">${order.grams} g</span>
                    <span class="amount">₹${order.orderPrice}</span>
                    <span class="status ${order.paymentStatus.toLowerCase()}">${
                    order.paymentStatus
                  }</span>
                    <span class="type ${order.transactionType.toLowerCase()}">${
                    order.transactionType
                  }</span>
                  </div>
                </div>
              </div>
            `
                )
                .join("") || "<p>No transactions found</p>"
            }
          </div>
        </div>
      </div>
    </div>
  `;

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
          <li><a href="/admin/dashboard"><i class="fas fa-home"></i>Dashboard</a></li>
          <li><a href="/admin/reedem" class="active"><i class="fas fa-users"></i>Reedem</a></li>
        </ul>
      </div>
      ${req.session.userPhone ? userContent : authContent}
    </body>
    </html>
  `;

  res.send(dashboard);
});

// Modify OTP generation endpoint
router.post("/generate-otp", async (req, res) => {
  const { phone } = req.body;

  try {
    // Find user by phone
    const user = await findUserByPhone(phone);

    if (!user) {
      return res.redirect(
        "/admin/reedem?error=" + encodeURIComponent("User not found")
      );
    }

    // Generate OTP
    const otp = generateOTP();

    // Update user's OTP in database
    const updated = await updateUserOTP(user.id, otp);

    if (!updated) {
      throw new Error("Failed to update OTP");
    }

    // Store phone number in session
    req.session.pendingPhone = phone;
    req.session.pendingUserId = user.id;

    // In a real application, you would send this OTP via SMS
    console.log(`OTP for ${phone}: ${otp}`);

    res.redirect("/admin/reedem");
  } catch (error) {
    console.error("OTP generation error:", error);
    const errorMessage = encodeURIComponent("Failed to generate OTP");
    res.redirect(`/admin/reedem?error=${errorMessage}`);
  }
});

// Update OTP verification endpoint to store phone instead of token
router.post("/verify-otp", async (req, res) => {
  const { otp } = req.body;
  const phone = req.session.pendingPhone;
  const userId = req.session.pendingUserId;

  if (!phone || !userId) {
    return res.redirect("/admin/reedem?error=Invalid session");
  }

  try {
    // Get user with current OTP
    const user = await findUserByPhone(phone);

    if (!user || user.tOtp !== otp) {
      return res.redirect(
        "/admin/reedem?error=" + encodeURIComponent("Invalid OTP")
      );
    }

    // Clear OTP after successful verification
    await updateUserOTP(userId, null);

    // Store phone in session instead of token
    req.session.userPhone = phone;

    // Clear pending data
    delete req.session.pendingPhone;
    delete req.session.pendingUserId;

    res.redirect("/admin/reedem");
  } catch (error) {
    console.error("OTP verification error:", error);
    const errorMessage = encodeURIComponent("Verification failed");
    res.redirect(`/admin/reedem?error=${errorMessage}`);
  }
});

// Update redemption endpoint to use phone
router.post("/redeem", async (req, res) => {
  const { material_type, amount } = req.body;
  const userData = await getUserData(req.session.userPhone); // Use phone instead of token
  const materialTypes = await getMaterialTypes();
  const balances = calculateBalancesByMaterial(
    userData.digital_orders,
    materialTypes
  );
  const balance = balances[material_type]?.currentBalance || 0;

  // Find the selected material type object
  const selectedMaterial = materialTypes.find(
    (m) => m.material_type === material_type
  );

  if (validateRedemption(balance, parseFloat(amount))) {
    try {
      // Generate a random transaction ID
      const transactionId = uuidv4().substring(0, 8);
      const token = process.env.STRAPI_SERVICE_TOKEN;

      const response = await axios.post(
        `${process.env.STRAPI_URL}/digital-orders`,
        {
          data: {
            user: userData.id,
            grams: parseFloat(amount),
            orderPrice: Number(amount * selectedMaterial.price), // Calculate order price
            goldPrice: selectedMaterial.price, // Current material price
            paymentStatus: "Success",
            transactionType: "Debit",
            material_type: selectedMaterial.documentId, // Use the material type ID
            transactionId: transactionId,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      res.redirect("/admin/reedem");
    } catch (error) {
      console.error("Redemption error:", error.response.data.error.message);
      const errorMessage = error.response.data.error.message;
      res.redirect(`/admin/reedem?error=${errorMessage}`);
    }
  } else {
    const errorMessage = encodeURIComponent(
      "Insufficient balance for redemption."
    );
    res.redirect(`/admin/reedem?error=${errorMessage}`);
  }
});

module.exports = router;
