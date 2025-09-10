const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // 기존 관리자 계정 확인
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@onetime.com' }
    });

    if (existingAdmin) {
      console.log('✅ 관리자 계정이 이미 존재합니다.');
      console.log('📧 이메일: admin@onetime.com');
      console.log('🔑 비밀번호: Admin123!@#');
      return;
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash('Admin123!@#', 12);

    // 관리자 계정 생성
    const admin = await prisma.user.create({
      data: {
        email: 'admin@onetime.com',
        name: '시스템 관리자',
        password: hashedPassword,
        userType: 'EMPLOYER', // 관리자는 고용주 타입으로 설정
        verified: true,
        phone: '010-0000-0000'
      }
    });

    console.log('🎉 관리자 계정이 성공적으로 생성되었습니다!');
    console.log('📧 이메일: admin@onetime.com');
    console.log('🔑 비밀번호: Admin123!@#');
    console.log('👤 사용자 ID:', admin.id);
    console.log('📱 전화번호: 010-0000-0000');

  } catch (error) {
    console.error('❌ 관리자 계정 생성 실패:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
createAdminUser();