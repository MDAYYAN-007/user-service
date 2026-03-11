const express = require("express");
const jwt = require("jsonwebtoken"); // 1. Import JWT
const app = express();

app.use(express.json());

// Secret key for signing tokens (In production, use an environment variable!)
const JWT_SECRET = "your_super_secret_key_123";

let users = [];
let nextId = 1;

// --- Helper Functions ---
function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

// 2. JWT Validation Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      // 03. Consistent error handling for expired/invalid tokens
      const message = err.name === 'TokenExpiredError' ? "Token expired" : "Invalid token";
      return res.status(403).json({ error: message });
    }
    
    // Attach the user info to the request object
    req.user = decodedUser;
    next(); 
  });
};

// --- Routes ---

// POST /users (Public - for registration)
app.post("/users", (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const newUser = { id: nextId++, name, email };
  users.push(newUser);

  // Generate a token so the user can actually use the API after signing up
  const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '1h' });

  return res.status(201).json({ user: newUser, token });
});

// 02. GET /users/:id (Protected - Enforces authentication)
app.get("/users/:id", authenticateToken, (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.status(200).json(user);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
