const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Default categories to seed
const DEFAULT_CATEGORIES = [
  // Expense categories
  { name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#ef4444' },
  { name: 'Transportation', type: 'expense', icon: '🚗', color: '#f97316' },
  { name: 'Shopping', type: 'expense', icon: '🛒', color: '#eab308' },
  { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#84cc16' },
  { name: 'Bills & Utilities', type: 'expense', icon: '💡', color: '#22c55e' },
  { name: 'Health', type: 'expense', icon: '🏥', color: '#14b8a6' },
  { name: 'Education', type: 'expense', icon: '📚', color: '#06b6d4' },
  { name: 'Other Expense', type: 'expense', icon: '📦', color: '#6b7280' },
  // Income categories
  { name: 'Salary', type: 'income', icon: '💰', color: '#10b981' },
  { name: 'Freelance', type: 'income', icon: '💻', color: '#3b82f6' },
  { name: 'Investments', type: 'income', icon: '📈', color: '#8b5cf6' },
  { name: 'Other Income', type: 'income', icon: '🎁', color: '#a855f7' },
];

// GET /categories - Get all categories
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    
    const where = type ? { type } : {};
    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /categories/seed - Seed default categories
router.post('/seed', async (req, res) => {
  try {
    const results = [];
    
    for (const category of DEFAULT_CATEGORIES) {
      const existing = await prisma.category.findUnique({
        where: { name: category.name },
      });
      
      if (!existing) {
        const created = await prisma.category.create({ data: category });
        results.push(created);
      }
    }

    res.json({
      message: `Seeded ${results.length} new categories.`,
      categories: results,
    });
  } catch (error) {
    console.error('Seed categories error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
