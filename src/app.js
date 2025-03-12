const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const session = require("express-session");
const path = require("path");

require("dotenv").config();

const middlewares = require("./middlewares");
const api = require("./api");

const order = require("./api/payment/index");
const digitalOrder = require("./api/digital-orders/index");
const admin = require("./api/admin/index");

const app = express();

app.use(morgan("dev"));
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

app.use(
  session({
    secret: "yourSecretKey", // replace with a secure key
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" }, // use secure cookies in production
  })
);

app.get("/", (req, res) => {
  res.json({
    message: "🦄🌈✨👋🌎🌍🌏✨🌈🦄",
  });
});

app.use("/api/v1", api);

app.use("/payment", order);

app.use("/digital-orders", digitalOrder);

app.use("/admin", admin);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;
