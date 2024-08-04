const express = require("express");
const helmet = require("helmet");
const csurf = require("csurf");
const xss = require("xss-clean");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(csurf({ cookie: true }));
app.use(xss());
app.use(cors());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get("/config/:service", (req, res) => {
  const serviceConfig =
    process.env[`CONFIG_${req.params.service.toUpperCase()}`];
  if (serviceConfig) {
    res.json(JSON.parse(serviceConfig));
  } else {
    res.status(404).json({ message: "Service configuration not found" });
  }
});

app.listen(port, () => {
  console.log(`Config service running on port ${port}`);
});
