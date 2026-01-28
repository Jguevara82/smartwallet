const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authMiddleware);

// Helper: Calculate next date based on frequency
const calculateNextDate = (fromDate, frequency) => {
  const date = new Date(fromDate);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  
  return date;
};

// GET /recurring - Get all recurring transactions
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;

    const recurring = await prisma.recurringTransaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { nextDate: 'asc' },
    });

    res.json(recurring);
  } catch (error) {
    console.error('Get recurring error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /recurring/upcoming - Get upcoming transactions for next 30 days
router.get('/upcoming', async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const recurring = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
        nextDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      include: { category: true },
      orderBy: { nextDate: 'asc' },
    });

    res.json(recurring);
  } catch (error) {
    console.error('Get upcoming error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /recurring/:id - Get single recurring transaction
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const recurring = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!recurring) {
      return res.status(404).json({ error: 'Recurring transaction not found.' });
    }

    res.json(recurring);
  } catch (error) {
    console.error('Get recurring error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /recurring - Create new recurring transaction
router.post('/', async (req, res) => {
  try {
    const { amount, description, type, categoryId, frequency, startDate, endDate } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!amount || !type || !categoryId || !frequency) {
      return res.status(400).json({ 
        error: 'Amount, type, categoryId, and frequency are required.' 
      });
    }

    // Validate type
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "income" or "expense".' });
    }

    // Validate frequency
    const validFrequencies = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({ 
        error: 'Frequency must be daily, weekly, biweekly, monthly, or yearly.' 
      });
    }

    // Validate category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return res.status(400).json({ error: 'Invalid category.' });
    }

    const start = startDate ? new Date(startDate) : new Date();
    
    const recurring = await prisma.recurringTransaction.create({
      data: {
        amount: parseFloat(amount),
        description,
        type,
        frequency,
        startDate: start,
        nextDate: start,
        endDate: endDate ? new Date(endDate) : null,
        userId,
        categoryId,
      },
      include: { category: true },
    });

    res.status(201).json(recurring);
  } catch (error) {
    console.error('Create recurring error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /recurring/:id - Update recurring transaction
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, type, categoryId, frequency, endDate, isActive } = req.body;
    const userId = req.user.userId;

    // Check if exists and belongs to user
    const existing = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Recurring transaction not found.' });
    }

    // Validate type if provided
    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "income" or "expense".' });
    }

    // Validate frequency if provided
    if (frequency) {
      const validFrequencies = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];
      if (!validFrequencies.includes(frequency)) {
        return res.status(400).json({ 
          error: 'Frequency must be daily, weekly, biweekly, monthly, or yearly.' 
        });
      }
    }

    // Validate category if provided
    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        return res.status(400).json({ error: 'Invalid category.' });
      }
    }

    const recurring = await prisma.recurringTransaction.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(categoryId && { categoryId }),
        ...(frequency && { frequency }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { category: true },
    });

    res.json(recurring);
  } catch (error) {
    console.error('Update recurring error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /recurring/:id - Delete recurring transaction
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if exists and belongs to user
    const existing = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Recurring transaction not found.' });
    }

    await prisma.recurringTransaction.delete({ where: { id } });

    res.json({ message: 'Recurring transaction deleted successfully.' });
  } catch (error) {
    console.error('Delete recurring error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /recurring/process - Process due recurring transactions and generate real transactions
router.post('/process', async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();

    // Find all active recurring transactions that are due
    const dueRecurring = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
        nextDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
      include: { category: true },
    });

    const generatedTransactions = [];

    for (const recurring of dueRecurring) {
      // Generate all transactions that are due (handle multiple missed periods)
      let currentDate = new Date(recurring.nextDate);
      
      while (currentDate <= now) {
        // Check if we should stop (endDate reached)
        if (recurring.endDate && currentDate > recurring.endDate) {
          break;
        }

        // Create the transaction
        const transaction = await prisma.transaction.create({
          data: {
            amount: recurring.amount,
            description: recurring.description 
              ? `${recurring.description} (Recurring)`
              : `Recurring ${recurring.type}`,
            type: recurring.type,
            date: currentDate,
            userId: recurring.userId,
            categoryId: recurring.categoryId,
          },
          include: { category: true },
        });

        generatedTransactions.push(transaction);

        // Move to next date
        currentDate = calculateNextDate(currentDate, recurring.frequency);
      }

      // Update the recurring transaction with new nextDate
      await prisma.recurringTransaction.update({
        where: { id: recurring.id },
        data: {
          nextDate: currentDate,
          lastProcessed: now,
        },
      });

      // Deactivate if endDate has passed
      if (recurring.endDate && currentDate > recurring.endDate) {
        await prisma.recurringTransaction.update({
          where: { id: recurring.id },
          data: { isActive: false },
        });
      }
    }

    res.json({
      message: `Processed ${dueRecurring.length} recurring transactions.`,
      generatedCount: generatedTransactions.length,
      transactions: generatedTransactions,
    });
  } catch (error) {
    console.error('Process recurring error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /recurring/:id/skip - Skip next occurrence
router.post('/:id/skip', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const recurring = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
    });

    if (!recurring) {
      return res.status(404).json({ error: 'Recurring transaction not found.' });
    }

    const newNextDate = calculateNextDate(recurring.nextDate, recurring.frequency);

    const updated = await prisma.recurringTransaction.update({
      where: { id },
      data: { nextDate: newNextDate },
      include: { category: true },
    });

    res.json({
      message: 'Skipped next occurrence.',
      recurring: updated,
    });
  } catch (error) {
    console.error('Skip recurring error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
