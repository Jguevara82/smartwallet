/**
 * Prisma Seed Script
 * 
 * This script seeds the database with default categories.
 * Run with: npm run db:seed
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const defaultCategories = [
  // Expense categories
  { name: 'Food', type: 'expense', icon: '🍔', color: '#ef4444' },
  { name: 'Transport', type: 'expense', icon: '🚗', color: '#f97316' },
  { name: 'Entertainment', type: 'expense', icon: '🎮', color: '#8b5cf6' },
  { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#ec4899' },
  { name: 'Bills', type: 'expense', icon: '📄', color: '#6366f1' },
  { name: 'Health', type: 'expense', icon: '💊', color: '#14b8a6' },
  { name: 'Education', type: 'expense', icon: '📚', color: '#0ea5e9' },
  { name: 'Other Expense', type: 'expense', icon: '📦', color: '#64748b' },
  
  // Income categories
  { name: 'Salary', type: 'income', icon: '💼', color: '#22c55e' },
  { name: 'Freelance', type: 'income', icon: '💻', color: '#10b981' },
  { name: 'Investment', type: 'income', icon: '📈', color: '#06b6d4' },
  { name: 'Other Income', type: 'income', icon: '💰', color: '#84cc16' },
];

async function main() {
  console.log('🌱 Seeding database...');

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
  }

  console.log(`✅ Created ${defaultCategories.length} categories`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
