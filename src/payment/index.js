const express = require("express");
const router = express.Router();
const payment = require("./payment");
const validate = require("./validate");

router.use("/", payment);

router.use("/validate", validate);

module.exports = router;
