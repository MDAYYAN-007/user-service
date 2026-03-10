const express = require("express");
const validator = require("validator");

const app = express();
app.use(express.json());

let users = [];
let nextId = 1;

// helper error function
function sendError(res, status, message, details = null) {
  const error = { error: message };
  if (details) error.details = details;
  return res.status(status).json(error);
}

// POST /users
app.post("/users", (req, res) => {
  const { name, email } = req.body || {};
  const details = {};

  // validation
  if (!name) details.name = "Name is required";

  if (!email) {
    details.email = "Email is required";
  } else if (!validator.isEmail(email)) {
    details.email = "Invalid email format";
  }

  if (Object.keys(details).length > 0) {
    return sendError(res, 400, "Validation failed", details);
  }

  // duplicate email check
  const duplicate = users.find((u) => u.email === email);
  if (duplicate) {
    return sendError(res, 409, "Email already exists", {
      email: "Duplicate email",
    });
  }

  const newUser = {
    id: nextId++,
    name,
    email,
  };

  users.push(newUser);

  return res.status(201).json(newUser);
});

// GET /users/:id
app.get("/users/:id", (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return sendError(res, 400, "Invalid user id", {
      id: "Must be a number",
    });
  }

  const user = users.find((u) => u.id === id);

  if (!user) {
    return sendError(res, 404, "User not found");
  }

  res.json(user);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
