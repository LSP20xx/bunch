const express = require("express");
const jwt = require("jsonwebtoken");
const config = require("./config.json");

const app = express();
const port = 3000;

app.use(express.json());

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Validate credentials
  if (username === config.username && password === config.password) {
    const token = jwt.sign({ username }, config.secret, { expiresIn: "1h" });
    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

app.listen(port, () => {
  console.log(`Auth service running on port ${port}`);
});
