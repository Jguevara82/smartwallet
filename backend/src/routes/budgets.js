const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authMiddleware);

// Helper: Get date range for period
const getDateRangeForPeriod = (period) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'weekly':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1); // Jan 1st
      break;
    case 'monthly':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of month
      break;
  }

  return { startDate, endDate: now };
};

// GET /budgets - Get all budgets with current spending status
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;

    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate current spending for each budget
    const budgetsWithStatus = await Promise.all(
      budgets.map(async (budget) => {
        const { startDate, endDate } = getDateRangeForPeriod(budget.period);

        const spending = await prisma.transaction.aggregate({
          where: {
            userId,
            categoryId: budget.categoryId,
            type: 'expense',
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: { amount: true },
        });

        const spent = spending._sum.amount || 0;
        const percentage = (spent / budget.amount) * 100;
        const remaining = budget.amount - spent;

        // Determine alert status
        let status = 'ok'; // Green
        if (percentage >= 100) {
          status = 'exceeded'; // Red
        } else if (percentage >= budget.alertThreshold * 100) {
          status = 'warning'; // Yellow/Orange
        }

        return {
          ...budget,
          spent,
          remaining,
          percentage: Math.min(percentage, 100),
          status,
          periodStart: startDate,
          periodEnd: endDate,
        };
      })
    );

    res.json(budgetsWithStatus);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /budgets/alerts - Get only budgets with warnings or exceeded
router.get('/alerts', async (req, res) => {
  try {
    const userId = req.user.userId;

    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true },
    });

    const alerts = [];

    for (const budget of budgets) {
      const { startDate, endDate } = getDateRangeForPeriod(budget.period);

      const spending = await prisma.transaction.aggregate({
        where: {
          userId,
          categoryId: budget.categoryId,
          type: 'expense',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { amount: true },
      });

      const spent = spending._sum.amount || 0;
      const percentage = (spent / budget.amount) * 100;

      if (percentage >= budget.alertThreshold * 100) {
        alerts.push({
          budgetId: budget.id,
          categoryName: budget.category.name,
          categoryIcon: budget.category.icon,
          budgetAmount: budget.amount,
          spent,
          percentage: Math.min(percentage, 100),
          status: percentage >= 100 ? 'exceeded' : 'warning',
          message:
            percentage >= 100
              ? `You've exceeded your ${budget.category.name} budget!`
              : `You've used ${percentage.toFixed(0)}% of your ${budget.category.name} budget`,
        });
      }
    }

    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /budgets/:id - Get single budget with status
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const budget = await prisma.budget.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found.' });
    }

    const { startDate, endDate } = getDateRangeForPeriod(budget.period);

    const spending = await prisma.transaction.aggregate({
      where: {
        userId,
        categoryId: budget.categoryId,
        type: 'expense',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
    });

    const spent = spending._sum.amount || 0;
    const percentage = (spent / budget.amount) * 100;

    res.json({
      ...budget,
      spent,
      remaining: budget.amount - spent,
      percentage: Math.min(percentage, 100),
      status: percentage >= 100 ? 'exceeded' : percentage >= budget.alertThreshold * 100 ? 'warning' : 'ok',
    });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /budgets - Create new budget
router.post('/', async (req, res) => {
  try {
    const { amount, categoryId, period = 'monthly', alertThreshold = 0.8 } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!amount || !categoryId) {
      return res.status(400).json({ error: 'Amount and categoryId are required.' });
    }

    // Validate category exists and is expense type
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return res.status(400).json({ error: 'Invalid category.' });
    }
    if (category.type !== 'expense') {
      return res.status(400).json({ error: 'Budgets can only be set for expense categories.' });
    }

    // Check if budget already exists for this category/period
    const existing = await prisma.budget.findFirst({
      where: { userId, categoryId, period },
    });
    if (existing) {
      return res.status(400).json({ 
        error: `A ${period} budget already exists for this category. Please edit the existing one.` 
      });
    }

    const budget = await prisma.budget.create({
      data: {
        amount: parseFloat(amount),
        period,
        alertThreshold: parseFloat(alertThreshold),
        userId,
        categoryId,
      },
      include: { category: true },
    });

    res.status(201).json(budget);
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /budgets/:id - Update budget
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, period, alertThreshold } = req.body;
    const userId = req.user.userId;

    // Check if budget exists and belongs to user
    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Budget not found.' });
    }

    const budget = await prisma.budget.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(period && { period }),
        ...(alertThreshold !== undefined && { alertThreshold: parseFloat(alertThreshold) }),
      },
      include: { category: true },
    });

    res.json(budget);
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /budgets/:id - Delete budget
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if budget exists and belongs to user
    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Budget not found.' });
    }

    await prisma.budget.delete({ where: { id } });

    res.json({ message: 'Budget deleted successfully.' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
