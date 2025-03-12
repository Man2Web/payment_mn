const express = require("express");
const router = express.Router();
const order = require("./order");
const validate = require("./validate");

const authMiddleware = require("../../middlewares/digitalOrderAuth");

router.use("/order", authMiddleware, order);

router.use("/validate", validate);

module.exports = router;
