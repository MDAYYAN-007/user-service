const express = require("express");
const validator = require("validator");

const app = express();
app.use(express.json());

let users = [];
let nextId = 1;

function sendError(res, status, message, details = null) {
  const error = { error: message };
  if (details) error.details = details;
  return res.status(status).json(error);
}

// POST /users
app.post("/users", (req, res) => {
  const body = req.body;

  // empty payload
  if (!body || Object.keys(body).length === 0) {
    return sendError(res, 400, "Request body cannot be empty");
  }

  const { name, email } = body;
  const details = {};

  if (!name) details.name = "Name is required";

  if (!email) {
    details.email = "Email is required";
  } else if (!validator.isEmail(email)) {
    details.email = "Invalid email format";
  }

  if (Object.keys(details).length > 0) {
    return sendError(res, 400, "Validation failed", details);
  }

  const duplicate = users.find((u) => u.email === email);
  if (duplicate) {
    return sendError(res, 400, "Email already exists", {
      email: "Duplicate email",
    });
  }

  const newUser = {
    id: nextId.toString(), // explicit generated id
    name,
    email,
  };

  nextId++;
  users.push(newUser);

  // return created user including id
  return res.status(201).json(newUser);
});

// GET /users/:id
app.get("/users/:id", (req, res) => {
  const id = req.params.id;

  const user = users.find((u) => u.id === id);

  if (!user) {
    return sendError(res, 404, "User not found");
  }

  res.json(user);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
