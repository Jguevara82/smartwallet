/**
 * SmartWallet API - Main Entry Point
 * 
 * A RESTful API for personal finance management built with Express.js and Prisma.
 * Provides endpoints for authentication, transactions, budgets, and recurring payments.
 * 
 * @requires dotenv - Environment variable management
 * @requires express - Web framework
 * @requires cors - Cross-origin resource sharing
 * @requires @prisma/client - Database ORM
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Import route modules
const authRoutes = require('./src/routes/auth');
const categoryRoutes = require('./src/routes/categories');
const transactionRoutes = require('./src/routes/transactions');
const budgetRoutes = require('./src/routes/budgets');
const recurringRoutes = require('./src/routes/recurring');

// Initialize Prisma client and Express app
const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Enable CORS for frontend requests
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// =============================================================================
// ROUTES
// =============================================================================

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'SmartWallet API is running!', 
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      categories: '/categories',
      transactions: '/transactions',
      budgets: '/budgets',
      recurring: '/recurring'
    }
  });
});

// Mount route modules
app.use('/auth', authRoutes);           // Authentication (register, login)
app.use('/categories', categoryRoutes); // Category management
app.use('/transactions', transactionRoutes); // Transaction CRUD
app.use('/budgets', budgetRoutes);      // Budget management
app.use('/recurring', recurringRoutes); // Recurring transactions

// =============================================================================
// ERROR HANDLING
// =============================================================================

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong!' });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

app.listen(port, () => {
  console.log(`🚀 SmartWallet API listening at http://localhost:${port}`);
});
