const express = require("express");
const app = express();

app.use(express.json());

let users = [];
let nextId = 1;

// simple email validation
function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

// POST /users
app.post("/users", (req, res) => {
  const { name, email } = req.body;

  // validation
  if (!name || !email) {
    return res.status(400).json({
      error: "Name and email are required",
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      error: "Invalid email format",
    });
  }

  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    return res.status(409).json({
      error: "Email already exists",
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
    return res.status(400).json({
      error: "Invalid user id",
    });
  }

  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  res.status(200).json(user);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
