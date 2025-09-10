const consul = require('consul');
const logger = require('../utils/logger');

class ServiceDiscovery {
  constructor() {
    this.consul = consul({
      host: process.env.CONSUL_HOST || 'localhost',
      port: process.env.CONSUL_PORT || 8500
    });
    
    this.services = new Map();
    this.healthCheckInterval = null;
  }

  async initialize() {
    try {
      // 기본 서비스 목록 (Consul 없이도 동작하도록)
      const defaultServices = {
        'user-service': {
          url: 'http://localhost:3001',
          health: '/health',
          status: 'unknown'
        },
        'job-service': {
          url: 'http://localhost:3002',
          health: '/health', 
          status: 'unknown'
        },
        'payment-service': {
          url: 'http://localhost:3003',
          health: '/health',
          status: 'unknown'
        },
        'search-service': {
          url: 'http://localhost:3004',
          health: '/health',
          status: 'unknown'
        },
        'notification-service': {
          url: 'http://localhost:3005',
          health: '/health',
          status: 'unknown'
        },
        'chat-service': {
          url: 'http://localhost:3006',
          health: '/health',
          status: 'unknown'
        }
      };

      // 기본 서비스 등록
      for (const [name, config] of Object.entries(defaultServices)) {
        this.services.set(name, config);
      }

      // Consul에서 서비스 목록 가져오기 시도
      try {
        const consulServices = await this.consul.catalog.service.list();
        logger.info('Services discovered from Consul:', Object.keys(consulServices));
        
        // Consul 서비스로 업데이트
        for (const serviceName of Object.keys(consulServices)) {
          if (serviceName.endsWith('-service')) {
            const serviceInfo = await this.consul.catalog.service.nodes(serviceName);
            if (serviceInfo.length > 0) {
              const service = serviceInfo[0];
              this.services.set(serviceName, {
                url: `http://${service.ServiceAddress}:${service.ServicePort}`,
                health: '/health',
                status: 'unknown'
              });
            }
          }
        }
      } catch (consulError) {
        logger.warn('Consul not available, using default service configuration:', consulError.message);
      }

      // 주기적 헬스체크 시작
      this.startHealthChecks();
      
      logger.info(`Service discovery initialized with ${this.services.size} services`);
    } catch (error) {
      logger.error('Service discovery initialization failed:', error);
      throw error;
    }
  }

  startHealthChecks() {
    this.healthCheckInterval = setInterval(async () => {
      await this.checkAllServices();
    }, 30000); // 30초마다 헬스체크
  }

  async checkAllServices() {
    const promises = Array.from(this.services.entries()).map(([name, config]) => 
      this.checkServiceHealth(name, config)
    );
    
    await Promise.allSettled(promises);
  }

  async checkServiceHealth(serviceName, config) {
    try {
      const response = await fetch(`${config.url}${config.health}`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        config.status = 'healthy';
        config.lastCheck = new Date();
      } else {
        config.status = 'unhealthy';
        config.lastCheck = new Date();
      }
    } catch (error) {
      config.status = 'unhealthy';
      config.lastCheck = new Date();
      config.error = error.message;
      
      logger.warn(`Health check failed for ${serviceName}:`, error.message);
    }
  }

  getService(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service '${serviceName}' not found`);
    }
    return service;
  }

  getServiceUrl(serviceName) {
    const service = this.getService(serviceName);
    return service.url;
  }

  getHealthyServices() {
    const healthyServices = {};
    for (const [name, config] of this.services.entries()) {
      if (config.status === 'healthy') {
        healthyServices[name] = {
          url: config.url,
          lastCheck: config.lastCheck
        };
      }
    }
    return healthyServices;
  }

  getServiceStatus() {
    const status = {};
    for (const [name, config] of this.services.entries()) {
      status[name] = {
        status: config.status,
        url: config.url,
        lastCheck: config.lastCheck,
        error: config.error
      };
    }
    return status;
  }

  async registerService(serviceName, serviceUrl, healthPath = '/health') {
    try {
      const service = {
        url: serviceUrl,
        health: healthPath,
        status: 'unknown'
      };

      this.services.set(serviceName, service);

      // Consul에 서비스 등록 시도
      try {
        const urlParts = new URL(serviceUrl);
        await this.consul.agent.service.register({
          name: serviceName,
          address: urlParts.hostname,
          port: parseInt(urlParts.port),
          check: {
            http: `${serviceUrl}${healthPath}`,
            interval: '30s',
            timeout: '10s'
          }
        });
        
        logger.info(`Service '${serviceName}' registered with Consul`);
      } catch (consulError) {
        logger.warn(`Failed to register service '${serviceName}' with Consul:`, consulError.message);
      }

      logger.info(`Service '${serviceName}' registered at ${serviceUrl}`);
    } catch (error) {
      logger.error(`Failed to register service '${serviceName}':`, error);
      throw error;
    }
  }

  async deregisterService(serviceName) {
    try {
      this.services.delete(serviceName);

      // Consul에서 서비스 해제
      try {
        await this.consul.agent.service.deregister(serviceName);
        logger.info(`Service '${serviceName}' deregistered from Consul`);
      } catch (consulError) {
        logger.warn(`Failed to deregister service '${serviceName}' from Consul:`, consulError.message);
      }

      logger.info(`Service '${serviceName}' deregistered`);
    } catch (error) {
      logger.error(`Failed to deregister service '${serviceName}':`, error);
    }
  }

  // 로드 밸런싱 (라운드 로빈)
  getNextServiceInstance(serviceName) {
    // 단일 인스턴스 환경에서는 기본 URL 반환
    return this.getServiceUrl(serviceName);
  }

  shutdown() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    logger.info('Service discovery shut down');
  }
}

const serviceDiscovery = new ServiceDiscovery();

module.exports = serviceDiscovery;