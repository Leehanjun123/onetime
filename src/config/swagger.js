const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '원데이 (OneDay) API Documentation',
      version: '1.0.0',
      description: `
        원데이는 한국의 단기 일자리 매칭 플랫폼입니다.
        이 API 문서는 모든 백엔드 서비스의 엔드포인트를 설명합니다.
        
        ## 주요 기능
        - 사용자 인증 및 관리
        - 일자리 등록 및 검색
        - 결제 및 정산 시스템
        - 실시간 채팅 및 알림
        - 고급 검색 (ElasticSearch)
        
        ## 인증
        Bearer Token을 사용하여 인증합니다.
        Authorization: Bearer <JWT_TOKEN>
      `,
      contact: {
        name: 'OneDay Support',
        email: 'support@onetime.kr'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      },
      {
        url: 'https://onetime-production.up.railway.app/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token을 입력하세요 (Bearer 접두사 제외)'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '사용자 고유 ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '이메일 주소'
            },
            name: {
              type: 'string',
              description: '사용자 이름'
            },
            phone: {
              type: 'string',
              description: '전화번호'
            },
            userType: {
              type: 'string',
              enum: ['WORKER', 'EMPLOYER', 'ADMIN'],
              description: '사용자 유형'
            },
            verified: {
              type: 'boolean',
              description: '인증 상태'
            },
            rating: {
              type: 'number',
              format: 'float',
              description: '평점 (0-5)'
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
              description: '계정 상태'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '계정 생성일'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '최종 수정일'
            }
          }
        },
        Job: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '일자리 고유 ID'
            },
            title: {
              type: 'string',
              description: '일자리 제목'
            },
            description: {
              type: 'string',
              description: '일자리 상세 설명'
            },
            category: {
              type: 'string',
              enum: ['CONSTRUCTION', 'INTERIOR', 'LOGISTICS', 'FACTORY', 'CLEANING', 'DELIVERY'],
              description: '일자리 카테고리'
            },
            location: {
              type: 'string',
              description: '근무 위치'
            },
            wage: {
              type: 'integer',
              description: '시급 (원)'
            },
            workDate: {
              type: 'string',
              format: 'date',
              description: '근무 날짜'
            },
            workStartTime: {
              type: 'string',
              format: 'time',
              description: '근무 시작 시간'
            },
            workEndTime: {
              type: 'string',
              format: 'time',
              description: '근무 종료 시간'
            },
            workHours: {
              type: 'integer',
              description: '총 근무 시간'
            },
            maxWorkers: {
              type: 'integer',
              description: '최대 모집 인원'
            },
            currentWorkers: {
              type: 'integer',
              description: '현재 지원자 수'
            },
            status: {
              type: 'string',
              enum: ['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
              description: '일자리 상태'
            },
            urgent: {
              type: 'boolean',
              description: '긴급 모집 여부'
            },
            requirements: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: '지원 자격 요건'
            },
            benefits: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: '복리혜택'
            },
            employerId: {
              type: 'string',
              description: '고용주 ID'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '생성일'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '수정일'
            }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '결제 고유 ID'
            },
            orderId: {
              type: 'string',
              description: '주문 ID'
            },
            paymentKey: {
              type: 'string',
              description: 'Toss 결제 키'
            },
            amount: {
              type: 'integer',
              description: '결제 금액 (원)'
            },
            feeAmount: {
              type: 'integer',
              description: '수수료 (원)'
            },
            netAmount: {
              type: 'integer',
              description: '실 지급액 (원)'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'FAILED'],
              description: '결제 상태'
            },
            method: {
              type: 'string',
              description: '결제 수단'
            },
            jobId: {
              type: 'string',
              description: '관련 일자리 ID'
            },
            payerId: {
              type: 'string',
              description: '결제자 ID'
            },
            receiverId: {
              type: 'string',
              description: '수취인 ID'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '결제 생성일'
            }
          }
        },
        Settlement: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '정산 고유 ID'
            },
            totalAmount: {
              type: 'integer',
              description: '총 정산 금액 (원)'
            },
            totalFees: {
              type: 'integer',
              description: '총 수수료 (원)'
            },
            netAmount: {
              type: 'integer',
              description: '실 정산액 (원)'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
              description: '정산 상태'
            },
            settlementDate: {
              type: 'string',
              format: 'date',
              description: '정산 예정일'
            },
            processedAt: {
              type: 'string',
              format: 'date-time',
              description: '정산 처리일'
            },
            userId: {
              type: 'string',
              description: '정산 대상 사용자 ID'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: '에러 메시지'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: '상세 에러 정보'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: '성공 메시지'
            },
            data: {
              type: 'object',
              description: '응답 데이터'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/models/*.js'
  ],
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};