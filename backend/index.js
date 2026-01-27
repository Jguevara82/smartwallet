require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Import routes
const authRoutes = require('./src/routes/auth');
const categoryRoutes = require('./src/routes/categories');
const transactionRoutes = require('./src/routes/transactions');

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'SmartWallet API is running!', version: '1.0.0' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/transactions', transactionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(`SmartWallet API listening at http://localhost:${port}`);
});
