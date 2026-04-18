const express = require("express");
const os = require("os");

const app = express();

const PORT = 3000;

// Get instance name from env
const INSTANCE = process.env.INSTANCE_NAME || os.hostname();

app.get("/", (req, res) => {
  res.send(`Hello World from ${INSTANCE}`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} - ${INSTANCE}`);
});