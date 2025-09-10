const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // 기존 관리자 확인
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@onetime.kr' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return existingAdmin;
    }

    // 관리자 계정 생성
    const hashedPassword = await bcrypt.hash('Admin123!@#', 12);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@onetime.kr',
        password: hashedPassword,
        name: '시스템 관리자',
        phone: '010-9999-9999',
        userType: 'ADMIN',
        verified: true,
        rating: 5.0,
        totalEarned: 0,
        createdAt: new Date()
      }
    });

    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@onetime.kr');
    console.log('🔐 Password: Admin123!@#');
    console.log('⚠️  Please change the password after first login');
    
    return admin;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
createAdminUser()
  .then(() => {
    console.log('✅ Admin seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Admin seed failed:', error);
    process.exit(1);
  });