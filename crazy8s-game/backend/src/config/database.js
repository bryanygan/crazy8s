const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

class DatabaseManager {
  constructor() {
    this.mongoConnection = null;
    this.sequelizeConnection = null;
    this.dbType = process.env.DB_TYPE || 'mongodb';
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000;
  }

  async connect() {
    try {
      if (this.dbType === 'none') {
        logger.info('🚫 Database disabled - running in memory-only mode');
        this.isConnected = false;
        return;
      }
      
      logger.info(`Initializing ${this.dbType} database connection...`);
      
      if (this.dbType === 'mongodb') {
        await this.connectMongoDB();
      } else if (this.dbType === 'postgresql') {
        await this.connectPostgreSQL();
      } else {
        throw new Error(`Unsupported database type: ${this.dbType}`);
      }
      
      this.isConnected = true;
      this.connectionAttempts = 0;
      logger.info(`✅ ${this.dbType} database connected successfully`);
      
    } catch (error) {
      logger.error(`❌ Database connection failed:`, error);
      await this.handleConnectionError(error);
    }
  }

  async connectMongoDB() {
    const mongoConfig = {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/crazy8s',
      options: {
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
        serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) || 5000,
        socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 45000,
        connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT) || 10000,
        maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME) || 30000,
        retryWrites: true,
        w: 'majority'
      }
    };

    // Set up connection event handlers
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      this.isConnected = true;
    });

    // Enable mongoose debugging in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }

    this.mongoConnection = await mongoose.connect(mongoConfig.uri, mongoConfig.options);
  }

  async connectPostgreSQL() {
    const sequelizeConfig = {
      database: process.env.DB_NAME || 'crazy8s',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: parseInt(process.env.DB_MAX_CONNECTIONS) || 50,     // Increased from 20 to support 8-player games
        min: parseInt(process.env.DB_MIN_CONNECTIONS) || 10,     // Increased from 5 for better baseline performance
        acquire: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 45000, // Increased from 30s to 45s
        idle: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,    // Increased from 10s to 30s (less aggressive)
        evict: parseInt(process.env.DB_EVICT_TIMEOUT) || 2000,   // Increased from 1s to 2s
        handleDisconnects: true,                                  // Auto-reconnect on connection loss
        validate: true                                            // Validate connections before use
      },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      },
      dialectOptions: {
        connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT) || 20000,
        idle_in_transaction_session_timeout: parseInt(process.env.DB_IDLE_IN_TRANSACTION_TIMEOUT) || 45000, // Increased from 30s
        query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 60000, // Increased from 30s to 60s
        statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 75000, // 75s for complex statements
        lock_timeout: parseInt(process.env.DB_LOCK_TIMEOUT) || 10000 // 10s for lock conflicts
      },
      retry: {
        max: 3,
        match: [
          /ECONNRESET/,
          /ENOTFOUND/,
          /ECONNREFUSED/,
          /ETIMEDOUT/,
          /EHOSTUNREACH/,
          /Connection terminated/
        ]
      }
    };

    this.sequelizeConnection = new Sequelize(sequelizeConfig);

    // Test the connection
    await this.sequelizeConnection.authenticate();
    
    // Set up connection event handlers
    this.sequelizeConnection.addHook('beforeConnect', () => {
      logger.info('PostgreSQL connection attempting...');
    });

    this.sequelizeConnection.addHook('afterConnect', () => {
      logger.info('PostgreSQL connected successfully');
    });

    this.sequelizeConnection.addHook('beforeDisconnect', () => {
      logger.info('PostgreSQL disconnecting...');
    });

    this.sequelizeConnection.addHook('afterDisconnect', () => {
      logger.info('PostgreSQL disconnected');
      this.isConnected = false;
    });
  }

  async handleConnectionError(error) {
    this.connectionAttempts++;
    
    if (this.connectionAttempts >= this.maxRetries) {
      logger.error(`❌ Maximum connection attempts (${this.maxRetries}) reached. Giving up.`);
      throw error;
    }

    logger.warn(`⚠️  Connection attempt ${this.connectionAttempts}/${this.maxRetries} failed. Retrying in ${this.retryDelay/1000} seconds...`);
    
    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
    await this.connect();
  }

  async disconnect() {
    try {
      if (this.dbType === 'mongodb' && this.mongoConnection) {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected');
      } else if (this.dbType === 'postgresql' && this.sequelizeConnection) {
        await this.sequelizeConnection.close();
        logger.info('PostgreSQL disconnected');
      }
      
      this.isConnected = false;
    } catch (error) {
      logger.error('Error during database disconnection:', error);
    }
  }

  async healthCheck() {
    try {
      if (this.dbType === 'mongodb') {
        const result = await mongoose.connection.db.admin().ping();
        return { status: 'healthy', type: 'mongodb', response: result };
      } else if (this.dbType === 'postgresql') {
        await this.sequelizeConnection.authenticate();
        return { status: 'healthy', type: 'postgresql', response: 'Connection verified' };
      }
    } catch (error) {
      logger.error('Database health check failed:', error);
      return { status: 'unhealthy', type: this.dbType, error: error.message };
    }
  }

  getConnection() {
    if (this.dbType === 'mongodb') {
      return this.mongoConnection;
    } else if (this.dbType === 'postgresql') {
      return this.sequelizeConnection;
    }
    return null;
  }

  getConnectionState() {
    if (this.dbType === 'mongodb') {
      return {
        type: 'mongodb',
        state: mongoose.connection.readyState,
        stateText: this.getMongoStateText(mongoose.connection.readyState),
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      };
    } else if (this.dbType === 'postgresql') {
      return {
        type: 'postgresql',
        state: this.sequelizeConnection ? 'connected' : 'disconnected',
        config: {
          host: this.sequelizeConnection?.config?.host,
          port: this.sequelizeConnection?.config?.port,
          database: this.sequelizeConnection?.config?.database
        }
      };
    }
    return { type: 'unknown', state: 'unknown' };
  }

  getMongoStateText(state) {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      4: 'uninitialized'
    };
    return states[state] || 'unknown';
  }

  async gracefulShutdown() {
    logger.info('Initiating graceful database shutdown...');
    
    try {
      if (this.dbType === 'mongodb') {
        // Wait for ongoing operations to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        await mongoose.disconnect();
      } else if (this.dbType === 'postgresql') {
        // Close the connection pool
        await this.sequelizeConnection.close();
      }
      
      logger.info('Database shutdown completed');
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
    }
  }
}

// Create singleton instance
const databaseManager = new DatabaseManager();

// Export both the class and the singleton
module.exports = {
  DatabaseManager,
  databaseManager,
  
  // Convenience methods
  connect: () => databaseManager.connect(),
  disconnect: () => databaseManager.disconnect(),
  getConnection: () => databaseManager.getConnection(),
  healthCheck: () => databaseManager.healthCheck(),
  getConnectionState: () => databaseManager.getConnectionState(),
  gracefulShutdown: () => databaseManager.gracefulShutdown(),
  
  // Getters
  get isConnected() { return databaseManager.isConnected; },
  get dbType() { return databaseManager.dbType; }
};