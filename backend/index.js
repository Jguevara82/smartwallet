const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Example: Create a new user
app.post('/user', async (req, res) => {
  const { email, name } = req.body;
  const user = await prisma.user.create({
    data: {
      email,
      name,
    },
  });
  res.json(user);
});

// Example: Get all users
app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
