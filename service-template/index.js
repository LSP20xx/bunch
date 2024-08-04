const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const csurf = require("csurf");
const xss = require("xss-clean");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const serviceRoutes = require("./routes/serviceRoutes");

const app = express();
const port = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(csurf({ cookie: true }));
app.use(xss());
app.use(cors());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Uncomment to enable authentication and role-based authorization
// const { authMiddleware } = require('../common-utils/authMiddleware');
// const { roleMiddleware } = require('../common-utils/roleMiddleware');
// app.use(authMiddleware);

app.use("/services", serviceRoutes);

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.listen(port, () => {
  console.log(`Service template running on port ${port}`);
});
