const express = require("express");
const router = express.Router();
const payment = require("./payment");
const validate = require("./validate");

const authMiddleware = require("../../middlewares/auth");

router.use("/", authMiddleware, payment);

router.use("/validate", validate);

module.exports = router;
