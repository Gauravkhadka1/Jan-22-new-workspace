const express = require("express");
const app = express();

app.get("/users", (req, res) => {
    res.json([{ userId: 1, username: "test@test", email: "test@test", profilePictureUrl: "default.jpg" }]);
});

// Remove app.listen() because Vercel handles it automatically
module.exports = app;
