const express = require("express");
const path = require("path");

const app = express();
const PORT = 3008;

// Log every request
app.use((req, res, next) => {
    console.log(`Received request: ${req.method} ${req.url}`);
    next();
});

// Serve static files properly
app.use("/static", express.static(path.join(__dirname, "static")));

// Explicitly serve index.html
app.get("/", (req, res) => {
    console.log("Serving index.html");
    res.sendFile(path.join(__dirname, "static", "index.html"));
});

// Handle 404 errors for unknown routes
app.use((req, res) => {
    res.status(404).send("404 Not Found");
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://192.168.1.18:${PORT}/`);
});
