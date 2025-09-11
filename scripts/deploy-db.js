#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function deployDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test if tables exist
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Database schema exists. Current user count: ${userCount}`);
    } catch (error) {
      console.log('❌ Database schema not found, needs migration');
      console.log('Run: npx prisma migrate deploy');
      process.exit(1);
    }
    
    console.log('🎉 Database deployment check complete!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deployDatabase();