const express = require("express");
const validator = require("validator");

const app = express();

/* ---------- Middleware ---------- */

// Handle invalid JSON bodies
app.use(express.json());
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Invalid JSON in request body",
    });
  }
  next();
});

/* ---------- In-memory storage ---------- */

const users = new Map();        // id -> user
const emailIndex = new Map();   // email -> id
let nextId = 1;

/* ---------- Helper ---------- */

function sendError(res, status, message, details = null) {
  const payload = { error: message };
  if (details) payload.details = details;
  return res.status(status).json(payload);
}

/* ---------- POST /users ---------- */

app.post("/users", (req, res) => {
  const body = req.body;

  // Empty body check
  if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
    return sendError(res, 400, "Request body cannot be empty");
  }

  const { name, email } = body;
  const details = {};

  if (!name || typeof name !== "string" || !name.trim()) {
    details.name = "Name is required and must be a non-empty string";
  }

  if (!email || typeof email !== "string") {
    details.email = "Email is required";
  } else if (!validator.isEmail(email)) {
    details.email = "Email must be a valid email address";
  }

  if (Object.keys(details).length > 0) {
    return sendError(res, 400, "Validation failed", details);
  }

  const normalizedEmail = email.toLowerCase();

  if (emailIndex.has(normalizedEmail)) {
    return sendError(res, 400, "Email must be unique", {
      email: "A user with this email already exists",
    });
  }

  const id = String(nextId++);

  const user = {
    id,
    name: name.trim(),
    email: normalizedEmail,
  };

  users.set(id, user);
  emailIndex.set(normalizedEmail, id);

  return res.status(201).json(user);
});

/* ---------- GET /users/:id ---------- */

app.get("/users/:id", (req, res) => {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return sendError(res, 400, "Invalid user id", {
      id: "User id must be provided",
    });
  }

  const user = users.get(id);

  if (!user) {
    return sendError(res, 404, "User not found", {
      id: "No user exists with the provided id",
    });
  }

  return res.status(200).json(user);
});

/* ---------- Fallback Routes ---------- */

app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
  });
});

/* ---------- Start Server ---------- */

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
