const ElasticsearchService = require('../services/ElasticsearchService');
const logger = require('./logger');

class SearchIndexer {
  constructor() {
    this.elasticsearchService = new ElasticsearchService();
  }

  // Job indexing hooks
  async onJobCreated(job) {
    try {
      const success = await this.elasticsearchService.indexJob(job);
      if (success) {
        logger.info(`Job indexed on creation: ${job.id}`);
      }
    } catch (error) {
      logger.error(`Failed to index job on creation: ${job.id}`, error);
    }
  }

  async onJobUpdated(job) {
    try {
      const success = await this.elasticsearchService.indexJob(job);
      if (success) {
        logger.info(`Job reindexed on update: ${job.id}`);
      }
    } catch (error) {
      logger.error(`Failed to reindex job on update: ${job.id}`, error);
    }
  }

  async onJobDeleted(jobId) {
    try {
      const success = await this.elasticsearchService.deleteJob(jobId);
      if (success) {
        logger.info(`Job removed from index on deletion: ${jobId}`);
      }
    } catch (error) {
      logger.error(`Failed to remove job from index on deletion: ${jobId}`, error);
    }
  }

  // User indexing hooks
  async onUserCreated(user) {
    try {
      const success = await this.elasticsearchService.indexUser(user);
      if (success) {
        logger.info(`User indexed on creation: ${user.id}`);
      }
    } catch (error) {
      logger.error(`Failed to index user on creation: ${user.id}`, error);
    }
  }

  async onUserUpdated(user) {
    try {
      const success = await this.elasticsearchService.indexUser(user);
      if (success) {
        logger.info(`User reindexed on update: ${user.id}`);
      }
    } catch (error) {
      logger.error(`Failed to reindex user on update: ${user.id}`, error);
    }
  }

  // Batch operations
  async indexExistingJobs(prismaClient, batchSize = 100) {
    try {
      let offset = 0;
      let processedCount = 0;

      while (true) {
        const jobs = await prismaClient.job.findMany({
          include: {
            employer: {
              select: { name: true }
            }
          },
          take: batchSize,
          skip: offset
        });

        if (jobs.length === 0) break;

        for (const job of jobs) {
          await this.elasticsearchService.indexJob(job);
          processedCount++;
        }

        logger.info(`Indexed ${processedCount} jobs so far...`);
        offset += batchSize;

        // Add small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      logger.info(`Completed indexing ${processedCount} jobs`);
      return processedCount;
    } catch (error) {
      logger.error('Failed to index existing jobs:', error);
      throw error;
    }
  }

  async indexExistingUsers(prismaClient, batchSize = 100) {
    try {
      let offset = 0;
      let processedCount = 0;

      while (true) {
        const users = await prismaClient.user.findMany({
          take: batchSize,
          skip: offset
        });

        if (users.length === 0) break;

        for (const user of users) {
          await this.elasticsearchService.indexUser(user);
          processedCount++;
        }

        logger.info(`Indexed ${processedCount} users so far...`);
        offset += batchSize;

        // Add small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      logger.info(`Completed indexing ${processedCount} users`);
      return processedCount;
    } catch (error) {
      logger.error('Failed to index existing users:', error);
      throw error;
    }
  }

  // Health check
  async isHealthy() {
    return this.elasticsearchService.isConnected;
  }
}

// Singleton instance
const searchIndexer = new SearchIndexer();

module.exports = searchIndexer;