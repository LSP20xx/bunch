const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const config = require("./config.json");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
const port = 8080;

app.use(cors());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use(express.json());

config.routes.forEach((route) => {
  app.use(
    route.path,
    createProxyMiddleware({ target: route.target, changeOrigin: true })
  );
});

app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});
