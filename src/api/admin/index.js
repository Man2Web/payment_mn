const express = require("express");
const router = express.Router();

const dashboard = require("./dashboard");
const reedem = require("./reedem");
const auth = require("./auth");
const adminAuthMiddleware = require("../../middlewares/adminAuth");

router.use("/auth", auth);

router.use("/dashboard", adminAuthMiddleware, dashboard);

router.use("/reedem", adminAuthMiddleware, reedem);

// router.use("/validate", validate);

module.exports = router;
