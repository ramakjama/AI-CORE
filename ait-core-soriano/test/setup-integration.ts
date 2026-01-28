import { DataSource } from 'typeorm';
import { createClient } from 'redis';

// Keep references to connections for cleanup
let dataSource: DataSource | null = null;
let redisClient: ReturnType<typeof createClient> | null = null;

// Setup before all tests
beforeAll(async () => {
  // Initialize test database
  dataSource = new DataSource({
    type: 'postgres',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    username: process.env.TEST_DB_USER || 'test',
    password: process.env.TEST_DB_PASSWORD || 'test',
    database: process.env.TEST_DB_NAME || 'test_ait_core',
    entities: [],
    synchronize: true,
    dropSchema: true,
  });

  try {
    await dataSource.initialize();
  } catch (error) {
    console.error('Failed to initialize test database:', error);
  }

  // Initialize Redis
  redisClient = createClient({
    url: process.env.TEST_REDIS_URL || 'redis://localhost:6379',
  });

  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to test Redis:', error);
  }
});

// Cleanup after all tests
afterAll(async () => {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
  }

  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
  }
});

// Clear data between tests
afterEach(async () => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.flushDb();
  }

  if (dataSource && dataSource.isInitialized) {
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.clear();
    }
  }
});

export { dataSource, redisClient };
