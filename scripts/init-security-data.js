const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const initializeSecurityData = async () => {
  console.log('🔧 보안 시스템 초기 데이터 설정 중...');
  
  try {
    // 1. 기본 권한 생성
    const permissions = [
      // User permissions
      { name: 'user:read', description: '사용자 정보 조회', category: 'user', resource: 'user', action: 'read' },
      { name: 'user:update', description: '사용자 정보 수정', category: 'user', resource: 'user', action: 'update' },
      { name: 'user:delete', description: '사용자 삭제', category: 'user', resource: 'user', action: 'delete' },
      
      // Job permissions
      { name: 'job:create', description: '일자리 등록', category: 'job', resource: 'job', action: 'create' },
      { name: 'job:read', description: '일자리 조회', category: 'job', resource: 'job', action: 'read' },
      { name: 'job:update', description: '일자리 수정', category: 'job', resource: 'job', action: 'update' },
      { name: 'job:delete', description: '일자리 삭제', category: 'job', resource: 'job', action: 'delete' },
      
      // Application permissions
      { name: 'application:create', description: '지원하기', category: 'application', resource: 'application', action: 'create' },
      { name: 'application:read', description: '지원 현황 조회', category: 'application', resource: 'application', action: 'read' },
      { name: 'application:update', description: '지원 상태 변경', category: 'application', resource: 'application', action: 'update' },
      
      // Payment permissions
      { name: 'payment:create', description: '결제 생성', category: 'payment', resource: 'payment', action: 'create' },
      { name: 'payment:read', description: '결제 조회', category: 'payment', resource: 'payment', action: 'read' },
      { name: 'payment:refund', description: '환불 처리', category: 'payment', resource: 'payment', action: 'refund' },
      
      // Admin permissions
      { name: 'admin:users', description: '사용자 관리', category: 'admin', resource: 'admin', action: 'users' },
      { name: 'admin:jobs', description: '일자리 관리', category: 'admin', resource: 'admin', action: 'jobs' },
      { name: 'admin:payments', description: '결제 관리', category: 'admin', resource: 'admin', action: 'payments' },
      { name: 'admin:analytics', description: '분석 데이터 조회', category: 'admin', resource: 'admin', action: 'analytics' },
      { name: 'admin:security', description: '보안 관리', category: 'admin', resource: 'admin', action: 'security' }
    ];

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: permission,
        create: permission
      });
    }

    // 2. 기본 역할 생성
    const roles = [
      { name: 'WORKER', description: '일반 근로자', level: 1, isSystem: true },
      { name: 'EMPLOYER', description: '고용주', level: 2, isSystem: true },
      { name: 'PREMIUM_WORKER', description: '프리미엄 근로자', level: 3, isSystem: false },
      { name: 'PREMIUM_EMPLOYER', description: '프리미엄 고용주', level: 4, isSystem: false },
      { name: 'ADMIN', description: '관리자', level: 9, isSystem: true },
      { name: 'SUPER_ADMIN', description: '최고 관리자', level: 10, isSystem: true }
    ];

    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: role,
        create: role
      });
    }

    // 3. 역할별 권한 할당
    const rolePermissions = [
      // WORKER 권한
      { roleName: 'WORKER', permissions: ['user:read', 'user:update', 'job:read', 'application:create', 'application:read'] },
      
      // EMPLOYER 권한  
      { roleName: 'EMPLOYER', permissions: ['user:read', 'user:update', 'job:create', 'job:read', 'job:update', 'job:delete', 'application:read', 'application:update', 'payment:create', 'payment:read'] },
      
      // PREMIUM_WORKER 권한
      { roleName: 'PREMIUM_WORKER', permissions: ['user:read', 'user:update', 'job:read', 'application:create', 'application:read', 'payment:read'] },
      
      // PREMIUM_EMPLOYER 권한
      { roleName: 'PREMIUM_EMPLOYER', permissions: ['user:read', 'user:update', 'job:create', 'job:read', 'job:update', 'job:delete', 'application:read', 'application:update', 'payment:create', 'payment:read', 'payment:refund'] },
      
      // ADMIN 권한
      { roleName: 'ADMIN', permissions: ['admin:users', 'admin:jobs', 'admin:payments', 'admin:analytics'] },
      
      // SUPER_ADMIN 권한 (모든 권한)
      { roleName: 'SUPER_ADMIN', permissions: permissions.map(p => p.name) }
    ];

    for (const rolePermission of rolePermissions) {
      const role = await prisma.role.findUnique({ where: { name: rolePermission.roleName } });
      if (role) {
        for (const permissionName of rolePermission.permissions) {
          const permission = await prisma.permission.findUnique({ where: { name: permissionName } });
          if (permission) {
            await prisma.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId: role.id,
                  permissionId: permission.id
                }
              },
              update: {},
              create: {
                roleId: role.id,
                permissionId: permission.id
              }
            });
          }
        }
      }
    }

    // 4. 기존 사용자들에게 기본 역할 할당
    const users = await prisma.user.findMany();
    for (const user of users) {
      let roleName = 'WORKER'; // 기본값
      
      if (user.userType === 'EMPLOYER') {
        roleName = 'EMPLOYER';
      } else if (user.userType === 'ADMIN') {
        roleName = 'SUPER_ADMIN';
      }
      
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (role) {
        await prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: user.id,
              roleId: role.id
            }
          },
          update: {},
          create: {
            userId: user.id,
            roleId: role.id
          }
        });
        
        // 신뢰도 점수 초기화
        await prisma.trustScore.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            score: 75, // 기본 신뢰도 점수
            deviceTrust: 50,
            behaviorTrust: 75,
            locationTrust: 75,
            networkTrust: 75
          }
        });
      }
    }

    console.log('✅ 보안 시스템 초기 데이터 설정 완료');
    console.log(`📊 생성된 권한: ${permissions.length}개`);
    console.log(`📊 생성된 역할: ${roles.length}개`);
    console.log(`📊 설정된 사용자: ${users.length}명`);
    
  } catch (error) {
    console.error('❌ 보안 시스템 초기화 오류:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  initializeSecurityData()
    .then(() => {
      console.log('🚀 보안 시스템 초기화 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 초기화 실패:', error);
      process.exit(1);
    });
}

module.exports = { initializeSecurityData };