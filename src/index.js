// Dev
const app = require("./app");

const port = process.env.PORT || 4000;
app.listen(port, () => {
  /* eslint-disable no-console */
  console.log(`Listening: http://localhost:${port}`);
  /* eslint-enable no-console */
});

// Prod
// const serverless = require("serverless-http");
// const app = require("./app");
// module.exports.handler = serverless(app);
