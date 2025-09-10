const { Client } = require('@elastic/elasticsearch');
const logger = require('../utils/logger');

class ElasticsearchService {
  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth: process.env.ELASTICSEARCH_PASSWORD ? {
        username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
        password: process.env.ELASTICSEARCH_PASSWORD
      } : undefined,
      requestTimeout: 30000,
      pingTimeout: 3000,
      maxRetries: 3,
    });

    this.indices = {
      jobs: 'onetime-jobs',
      users: 'onetime-users',
      businesses: 'onetime-businesses',
    };

    this.isConnected = false;
    this.initializeConnection();
  }

  async initializeConnection() {
    try {
      await this.client.ping();
      this.isConnected = true;
      logger.info('Elasticsearch connected successfully');
      
      // Create indices if they don't exist
      await this.createIndices();
    } catch (error) {
      this.isConnected = false;
      logger.error('Elasticsearch connection failed:', error.message);
    }
  }

  async createIndices() {
    try {
      // Create jobs index
      const jobIndexExists = await this.client.indices.exists({
        index: this.indices.jobs
      });

      if (!jobIndexExists) {
        await this.client.indices.create({
          index: this.indices.jobs,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                title: { 
                  type: 'text',
                  analyzer: 'korean',
                  search_analyzer: 'korean'
                },
                description: { 
                  type: 'text',
                  analyzer: 'korean',
                  search_analyzer: 'korean'
                },
                category: { type: 'keyword' },
                location: { 
                  type: 'text',
                  analyzer: 'korean',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                wage: { type: 'integer' },
                workDate: { type: 'date' },
                workHours: { type: 'integer' },
                status: { type: 'keyword' },
                urgent: { type: 'boolean' },
                employerId: { type: 'keyword' },
                employerName: { 
                  type: 'text',
                  analyzer: 'korean'
                },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
                geoLocation: { type: 'geo_point' },
                tags: { type: 'keyword' },
                searchableText: {
                  type: 'text',
                  analyzer: 'korean',
                  search_analyzer: 'korean'
                }
              }
            },
            settings: {
              analysis: {
                analyzer: {
                  korean: {
                    type: 'custom',
                    tokenizer: 'nori_tokenizer',
                    filter: ['lowercase', 'nori_part_of_speech', 'nori_readingform']
                  }
                }
              }
            }
          }
        });
        logger.info('Jobs index created successfully');
      }

      // Create users index
      const userIndexExists = await this.client.indices.exists({
        index: this.indices.users
      });

      if (!userIndexExists) {
        await this.client.indices.create({
          index: this.indices.users,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                name: { 
                  type: 'text',
                  analyzer: 'korean'
                },
                email: { type: 'keyword' },
                phone: { type: 'keyword' },
                userType: { type: 'keyword' },
                verified: { type: 'boolean' },
                rating: { type: 'float' },
                totalEarned: { type: 'integer' },
                createdAt: { type: 'date' },
                skills: { type: 'keyword' },
                location: { 
                  type: 'text',
                  analyzer: 'korean'
                },
                geoLocation: { type: 'geo_point' },
                isActive: { type: 'boolean' }
              }
            }
          }
        });
        logger.info('Users index created successfully');
      }

      // Create businesses index
      const businessIndexExists = await this.client.indices.exists({
        index: this.indices.businesses
      });

      if (!businessIndexExists) {
        await this.client.indices.create({
          index: this.indices.businesses,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                name: { 
                  type: 'text',
                  analyzer: 'korean',
                  search_analyzer: 'korean'
                },
                description: { 
                  type: 'text',
                  analyzer: 'korean'
                },
                category: { type: 'keyword' },
                address: { 
                  type: 'text',
                  analyzer: 'korean'
                },
                phone: { type: 'keyword' },
                email: { type: 'keyword' },
                rating: { type: 'float' },
                totalJobs: { type: 'integer' },
                verifiedBusiness: { type: 'boolean' },
                createdAt: { type: 'date' },
                geoLocation: { type: 'geo_point' },
                tags: { type: 'keyword' }
              }
            }
          }
        });
        logger.info('Businesses index created successfully');
      }
    } catch (error) {
      logger.error('Failed to create Elasticsearch indices:', error);
    }
  }

  // Jobs search and indexing
  async indexJob(jobData) {
    if (!this.isConnected) return false;

    try {
      const doc = {
        id: jobData.id,
        title: jobData.title,
        description: jobData.description,
        category: jobData.category,
        location: jobData.location,
        wage: jobData.wage,
        workDate: jobData.workDate,
        workHours: jobData.workHours,
        status: jobData.status,
        urgent: jobData.urgent,
        employerId: jobData.employerId,
        employerName: jobData.employer?.name,
        createdAt: jobData.createdAt,
        updatedAt: jobData.updatedAt,
        tags: this.extractTags(jobData),
        searchableText: `${jobData.title} ${jobData.description} ${jobData.location} ${jobData.employer?.name || ''}`,
        // Add geo location if available
        geoLocation: jobData.geoLocation ? {
          lat: jobData.geoLocation.lat,
          lon: jobData.geoLocation.lon
        } : undefined
      };

      await this.client.index({
        index: this.indices.jobs,
        id: jobData.id,
        body: doc
      });

      logger.info(`Job indexed successfully: ${jobData.id}`);
      return true;
    } catch (error) {
      logger.error('Failed to index job:', error);
      return false;
    }
  }

  async searchJobs(query, filters = {}, options = {}) {
    if (!this.isConnected) return { jobs: [], total: 0 };

    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'relevance',
        location,
        category,
        minWage,
        maxWage,
        workDate,
        urgent,
        radius = 10, // km
        geoLocation
      } = { ...filters, ...options };

      const offset = (page - 1) * limit;

      let searchBody = {
        query: {
          bool: {
            must: [],
            filter: [],
            should: [],
            must_not: []
          }
        },
        sort: [],
        from: offset,
        size: limit,
        highlight: {
          fields: {
            title: {},
            description: {},
            location: {}
          }
        }
      };

      // Text search
      if (query && query.trim()) {
        searchBody.query.bool.must.push({
          multi_match: {
            query: query,
            fields: [
              'title^3',
              'description^2',
              'searchableText',
              'location',
              'employerName'
            ],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      } else {
        searchBody.query.bool.must.push({
          match_all: {}
        });
      }

      // Status filter (only show open jobs by default)
      searchBody.query.bool.filter.push({
        term: { status: 'OPEN' }
      });

      // Category filter
      if (category) {
        searchBody.query.bool.filter.push({
          term: { category: category }
        });
      }

      // Location filter
      if (location) {
        searchBody.query.bool.should.push({
          match: {
            location: {
              query: location,
              boost: 2
            }
          }
        });
      }

      // Geo location filter
      if (geoLocation && geoLocation.lat && geoLocation.lon) {
        searchBody.query.bool.filter.push({
          geo_distance: {
            distance: `${radius}km`,
            geoLocation: {
              lat: geoLocation.lat,
              lon: geoLocation.lon
            }
          }
        });
      }

      // Wage filter
      if (minWage || maxWage) {
        const rangeFilter = { wage: {} };
        if (minWage) rangeFilter.wage.gte = minWage;
        if (maxWage) rangeFilter.wage.lte = maxWage;
        searchBody.query.bool.filter.push({ range: rangeFilter });
      }

      // Work date filter
      if (workDate) {
        searchBody.query.bool.filter.push({
          range: {
            workDate: {
              gte: workDate,
              lte: workDate
            }
          }
        });
      }

      // Urgent jobs boost
      if (urgent) {
        searchBody.query.bool.filter.push({
          term: { urgent: true }
        });
      }

      // Sorting
      switch (sortBy) {
        case 'wage_desc':
          searchBody.sort.push({ wage: { order: 'desc' } });
          break;
        case 'wage_asc':
          searchBody.sort.push({ wage: { order: 'asc' } });
          break;
        case 'date_desc':
          searchBody.sort.push({ createdAt: { order: 'desc' } });
          break;
        case 'date_asc':
          searchBody.sort.push({ createdAt: { order: 'asc' } });
          break;
        case 'work_date':
          searchBody.sort.push({ workDate: { order: 'asc' } });
          break;
        case 'distance':
          if (geoLocation && geoLocation.lat && geoLocation.lon) {
            searchBody.sort.push({
              '_geo_distance': {
                geoLocation: {
                  lat: geoLocation.lat,
                  lon: geoLocation.lon
                },
                order: 'asc',
                unit: 'km'
              }
            });
          }
          break;
        default: // relevance
          searchBody.sort.push('_score');
      }

      // Boost urgent jobs
      searchBody.query.bool.should.push({
        term: {
          urgent: {
            value: true,
            boost: 1.5
          }
        }
      });

      const response = await this.client.search({
        index: this.indices.jobs,
        body: searchBody
      });

      const jobs = response.body.hits.hits.map(hit => ({
        ...hit._source,
        score: hit._score,
        highlights: hit.highlight
      }));

      return {
        jobs,
        total: response.body.hits.total.value,
        maxScore: response.body.hits.max_score,
        took: response.body.took
      };
    } catch (error) {
      logger.error('Job search failed:', error);
      return { jobs: [], total: 0 };
    }
  }

  async suggestJobs(query, limit = 5) {
    if (!this.isConnected || !query) return [];

    try {
      const response = await this.client.search({
        index: this.indices.jobs,
        body: {
          suggest: {
            job_suggest: {
              prefix: query,
              completion: {
                field: 'title.suggest',
                size: limit
              }
            }
          },
          _source: ['id', 'title', 'location', 'wage']
        }
      });

      return response.body.suggest.job_suggest[0].options.map(option => ({
        id: option._source.id,
        title: option._source.title,
        location: option._source.location,
        wage: option._source.wage,
        score: option._score
      }));
    } catch (error) {
      logger.error('Job suggestion failed:', error);
      return [];
    }
  }

  async deleteJob(jobId) {
    if (!this.isConnected) return false;

    try {
      await this.client.delete({
        index: this.indices.jobs,
        id: jobId
      });
      logger.info(`Job deleted from index: ${jobId}`);
      return true;
    } catch (error) {
      if (error.meta?.statusCode === 404) {
        logger.warn(`Job not found in index: ${jobId}`);
        return true;
      }
      logger.error('Failed to delete job from index:', error);
      return false;
    }
  }

  // User search and indexing
  async indexUser(userData) {
    if (!this.isConnected) return false;

    try {
      const doc = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        userType: userData.userType,
        verified: userData.verified,
        rating: userData.rating,
        totalEarned: userData.totalEarned,
        createdAt: userData.createdAt,
        skills: userData.skills || [],
        location: userData.location,
        geoLocation: userData.geoLocation,
        isActive: userData.status === 'ACTIVE'
      };

      await this.client.index({
        index: this.indices.users,
        id: userData.id,
        body: doc
      });

      return true;
    } catch (error) {
      logger.error('Failed to index user:', error);
      return false;
    }
  }

  async searchUsers(query, filters = {}, options = {}) {
    if (!this.isConnected) return { users: [], total: 0 };

    try {
      const { page = 1, limit = 20, userType } = { ...filters, ...options };
      const offset = (page - 1) * limit;

      let searchBody = {
        query: {
          bool: {
            must: [],
            filter: []
          }
        },
        from: offset,
        size: limit
      };

      if (query && query.trim()) {
        searchBody.query.bool.must.push({
          multi_match: {
            query: query,
            fields: ['name^2', 'email', 'skills'],
            fuzziness: 'AUTO'
          }
        });
      } else {
        searchBody.query.bool.must.push({
          match_all: {}
        });
      }

      // User type filter
      if (userType) {
        searchBody.query.bool.filter.push({
          term: { userType: userType }
        });
      }

      // Active users only
      searchBody.query.bool.filter.push({
        term: { isActive: true }
      });

      const response = await this.client.search({
        index: this.indices.users,
        body: searchBody
      });

      const users = response.body.hits.hits.map(hit => hit._source);

      return {
        users,
        total: response.body.hits.total.value
      };
    } catch (error) {
      logger.error('User search failed:', error);
      return { users: [], total: 0 };
    }
  }

  // Utility functions
  extractTags(jobData) {
    const tags = [];
    
    // Add category as tag
    if (jobData.category) {
      tags.push(jobData.category.toLowerCase());
    }

    // Add urgent tag
    if (jobData.urgent) {
      tags.push('urgent');
    }

    // Extract tags from title and description
    const text = `${jobData.title} ${jobData.description}`.toLowerCase();
    const keywords = ['경험자', '초보', '단기', '장기', '주말', '평일', '야간', '오전', '오후'];
    
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.push(keyword);
      }
    });

    return tags;
  }

  async getIndexStats() {
    if (!this.isConnected) return null;

    try {
      const stats = await this.client.indices.stats({
        index: Object.values(this.indices).join(',')
      });

      return {
        jobs: stats.body.indices[this.indices.jobs]?.total?.docs?.count || 0,
        users: stats.body.indices[this.indices.users]?.total?.docs?.count || 0,
        businesses: stats.body.indices[this.indices.businesses]?.total?.docs?.count || 0
      };
    } catch (error) {
      logger.error('Failed to get index stats:', error);
      return null;
    }
  }

  async reindexAllJobs(prismaClient) {
    if (!this.isConnected) return false;

    try {
      // Delete existing index
      await this.client.indices.delete({
        index: this.indices.jobs,
        ignore_unavailable: true
      });

      // Recreate index
      await this.createIndices();

      // Get all jobs from database
      const jobs = await prismaClient.job.findMany({
        include: {
          employer: {
            select: { name: true }
          }
        }
      });

      // Index all jobs
      for (const job of jobs) {
        await this.indexJob(job);
      }

      logger.info(`Reindexed ${jobs.length} jobs successfully`);
      return true;
    } catch (error) {
      logger.error('Failed to reindex jobs:', error);
      return false;
    }
  }
}

module.exports = ElasticsearchService;