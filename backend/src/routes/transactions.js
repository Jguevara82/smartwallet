const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authMiddleware);

// GET /transactions - Get all transactions for current user
router.get('/', async (req, res) => {
  try {
    const { type, categoryId, startDate, endDate } = req.query;
    
    const where = { userId: req.user.userId };
    
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /transactions/summary - Get summary statistics
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get total income
    const incomeResult = await prisma.transaction.aggregate({
      where: { userId, type: 'income' },
      _sum: { amount: true },
    });

    // Get total expenses
    const expenseResult = await prisma.transaction.aggregate({
      where: { userId, type: 'expense' },
      _sum: { amount: true },
    });

    // Get expenses by category
    const expensesByCategory = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'expense' },
      _sum: { amount: true },
    });

    // Get category details for expenses
    const categoryIds = expensesByCategory.map(e => e.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    const expensesByCategoryWithDetails = expensesByCategory.map(expense => {
      const category = categories.find(c => c.id === expense.categoryId);
      return {
        categoryId: expense.categoryId,
        categoryName: category?.name || 'Unknown',
        categoryIcon: category?.icon || '📦',
        categoryColor: category?.color || '#6b7280',
        total: expense._sum.amount || 0,
      };
    });

    const totalIncome = incomeResult._sum.amount || 0;
    const totalExpenses = expenseResult._sum.amount || 0;
    const balance = totalIncome - totalExpenses;

    res.json({
      totalIncome,
      totalExpenses,
      balance,
      expensesByCategory: expensesByCategoryWithDetails,
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /transactions/:id - Get single transaction
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: req.user.userId },
      include: { category: true },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /transactions - Create new transaction
router.post('/', async (req, res) => {
  try {
    const { amount, description, type, categoryId, date } = req.body;

    // Validate required fields
    if (!amount || !type || !categoryId) {
      return res.status(400).json({ 
        error: 'Amount, type, and categoryId are required.' 
      });
    }

    // Validate type
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "income" or "expense".' });
    }

    // Validate category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return res.status(400).json({ error: 'Invalid category.' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        description,
        type,
        categoryId,
        userId: req.user.userId,
        date: date ? new Date(date) : new Date(),
      },
      include: { category: true },
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /transactions/:id - Update transaction
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, type, categoryId, date } = req.body;

    // Check if transaction exists and belongs to user
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.user.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    // Validate type if provided
    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "income" or "expense".' });
    }

    // Validate category if provided
    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        return res.status(400).json({ error: 'Invalid category.' });
      }
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(categoryId && { categoryId }),
        ...(date && { date: new Date(date) }),
      },
      include: { category: true },
    });

    res.json(transaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /transactions/:id - Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if transaction exists and belongs to user
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.user.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    await prisma.transaction.delete({ where: { id } });

    res.json({ message: 'Transaction deleted successfully.' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
