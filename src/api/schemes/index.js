const express = require("express");
const router = express.Router();

const payment = require("./payment");

router.use("/", payment);

module.exports = router;
