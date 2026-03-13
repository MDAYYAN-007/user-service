const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

// JWT Secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("JWT_SECRET is not defined in environment variables");
  process.exit(1);
}

let users = [];
let nextId = 1;

// --- Helper Functions ---
function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

// --- Middleware ---
// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = decodedUser;
    next();
  });
};

// --- Routes ---

// POST /users (User Registration)
app.post("/users", (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  // Email format validation
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const existingUser = users.find((u) => u.email === email);

  if (existingUser) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const newUser = {
    id: nextId++,
    name,
    email,
  };

  users.push(newUser);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  return res.status(201).json({
    user: newUser,
    token,
  });
});

// GET /users/:id (Protected with Ownership Check)
app.get("/users/:id", authenticateToken, (req, res) => {
  const requestedId = Number(req.params.id);

  if (isNaN(requestedId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  // Ownership validation
  if (req.user.id !== requestedId) {
    return res.status(403).json({
      error: "Forbidden: You cannot access other users' data",
    });
  }

  const user = users.find((u) => u.id === requestedId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json(user);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
