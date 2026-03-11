const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();

app.use(express.json());

const JWT_SECRET = "your_super_secret_key_2026";

let users = [];
let nextId = 1;

// --- Middleware ---

// 01. Consistent JWT Validation & 401 Error Handling
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      // Requirements specify a consistent 401 for invalid/expired tokens
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = decodedUser;
    next(); 
  });
};

// --- Routes ---

// POST /users (Registration)
app.post("/users", (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) return res.status(400).json({ error: "Name and email required" });

  const existingUser = users.find((u) => u.email === email);
  if (existingUser) return res.status(409).json({ error: "Email already exists" });

  const newUser = { id: nextId++, name, email };
  users.push(newUser);

  const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '1h' });
  return res.status(201).json({ user: newUser, token });
});

// 02. GET /users/:id (Protected with Ownership Check)
app.get("/users/:id", authenticateToken, (req, res) => {
  const requestedId = Number(req.params.id);

  // Requirement: Ensure the userId from token matches the :id parameter
  if (req.user.id !== requestedId) {
    return res.status(403).json({ error: "Forbidden: You cannot access other users' data" });
  }

  const user = users.find((u) => u.id === requestedId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.status(200).json(user);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
