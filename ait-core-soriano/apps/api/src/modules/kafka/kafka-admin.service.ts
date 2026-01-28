import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import {
  ITopicConfig,
  ITopicMetadata,
  ITopicPartitionOffsets,
  IResourceConfigEntry,
} from 'kafkajs';

export interface CreateTopicOptions {
  topic: string;
  numPartitions?: number;
  replicationFactor?: number;
  configEntries?: Array<{ name: string; value: string }>;
}

/**
 * Kafka Admin Service
 *
 * Service for Kafka cluster administration tasks.
 *
 * Features:
 * - Topic management (create, delete, list)
 * - Topic configuration
 * - Consumer group management
 * - Offset management
 * - Cluster metadata
 *
 * @service KafkaAdminService
 */
@Injectable()
export class KafkaAdminService {
  private readonly logger = new Logger(KafkaAdminService.name);

  constructor(private kafkaService: KafkaService) {}

  /**
   * Create a new topic
   *
   * @param options - Topic creation options
   */
  async createTopic(options: CreateTopicOptions): Promise<boolean> {
    try {
      const admin = this.kafkaService.getAdmin();

      await admin.createTopics({
        topics: [
          {
            topic: options.topic,
            numPartitions: options.numPartitions || 3,
            replicationFactor: options.replicationFactor || 1,
            configEntries: options.configEntries || [],
          },
        ],
        waitForLeaders: true,
        timeout: 30000,
      });

      this.logger.log(`Topic created successfully: ${options.topic}`);
      return true;
    } catch (error) {
      this.logger.error(`Error creating topic ${options.topic}:`, error);
      throw error;
    }
  }

  /**
   * Create multiple topics
   *
   * @param topics - Array of topic options
   */
  async createTopics(topics: CreateTopicOptions[]): Promise<boolean> {
    try {
      const admin = this.kafkaService.getAdmin();

      await admin.createTopics({
        topics: topics.map((topic) => ({
          topic: topic.topic,
          numPartitions: topic.numPartitions || 3,
          replicationFactor: topic.replicationFactor || 1,
          configEntries: topic.configEntries || [],
        })),
        waitForLeaders: true,
        timeout: 30000,
      });

      this.logger.log(`Created ${topics.length} topics successfully`);
      return true;
    } catch (error) {
      this.logger.error('Error creating topics:', error);
      throw error;
    }
  }

  /**
   * Delete a topic
   *
   * @param topic - Topic name
   */
  async deleteTopic(topic: string): Promise<void> {
    try {
      const admin = this.kafkaService.getAdmin();

      await admin.deleteTopics({
        topics: [topic],
        timeout: 30000,
      });

      this.logger.log(`Topic deleted successfully: ${topic}`);
    } catch (error) {
      this.logger.error(`Error deleting topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Delete multiple topics
   *
   * @param topics - Array of topic names
   */
  async deleteTopics(topics: string[]): Promise<void> {
    try {
      const admin = this.kafkaService.getAdmin();

      await admin.deleteTopics({
        topics,
        timeout: 30000,
      });

      this.logger.log(`Deleted ${topics.length} topics successfully`);
    } catch (error) {
      this.logger.error('Error deleting topics:', error);
      throw error;
    }
  }

  /**
   * List all topics
   *
   * @returns Array of topic names
   */
  async listTopics(): Promise<string[]> {
    try {
      const admin = this.kafkaService.getAdmin();
      const topics = await admin.listTopics();

      this.logger.debug(`Found ${topics.length} topics`);
      return topics;
    } catch (error) {
      this.logger.error('Error listing topics:', error);
      throw error;
    }
  }

  /**
   * Get topic metadata
   *
   * @param topics - Array of topic names (empty for all topics)
   */
  async describeTopics(topics?: string[]): Promise<ITopicMetadata[]> {
    try {
      const admin = this.kafkaService.getAdmin();
      const metadata = await admin.fetchTopicMetadata({
        topics,
      });

      return metadata.topics;
    } catch (error) {
      this.logger.error('Error describing topics:', error);
      throw error;
    }
  }

  /**
   * Get topic configuration
   *
   * @param topic - Topic name
   */
  async getTopicConfig(topic: string): Promise<IResourceConfigEntry[]> {
    try {
      const admin = this.kafkaService.getAdmin();

      const result = await admin.describeConfigs({
        resources: [
          {
            type: 2, // TOPIC
            name: topic,
          },
        ],
      });

      return result.resources[0]?.configEntries || [];
    } catch (error) {
      this.logger.error(`Error getting config for topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Update topic configuration
   *
   * @param topic - Topic name
   * @param configEntries - Configuration entries to update
   */
  async updateTopicConfig(
    topic: string,
    configEntries: Array<{ name: string; value: string }>,
  ): Promise<void> {
    try {
      const admin = this.kafkaService.getAdmin();

      await admin.alterConfigs({
        resources: [
          {
            type: 2, // TOPIC
            name: topic,
            configEntries,
          },
        ],
      });

      this.logger.log(`Topic configuration updated: ${topic}`);
    } catch (error) {
      this.logger.error(`Error updating config for topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * List consumer groups
   *
   * @returns Array of consumer group IDs
   */
  async listConsumerGroups(): Promise<Array<{ groupId: string; protocolType: string }>> {
    try {
      const admin = this.kafkaService.getAdmin();
      const groups = await admin.listGroups();

      return groups.groups;
    } catch (error) {
      this.logger.error('Error listing consumer groups:', error);
      throw error;
    }
  }

  /**
   * Describe consumer group
   *
   * @param groupId - Consumer group ID
   */
  async describeConsumerGroup(groupId: string): Promise<any> {
    try {
      const admin = this.kafkaService.getAdmin();
      const result = await admin.describeGroups([groupId]);

      return result.groups[0];
    } catch (error) {
      this.logger.error(`Error describing consumer group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Delete consumer group
   *
   * @param groupId - Consumer group ID
   */
  async deleteConsumerGroup(groupId: string): Promise<void> {
    try {
      const admin = this.kafkaService.getAdmin();

      await admin.deleteGroups([groupId]);

      this.logger.log(`Consumer group deleted: ${groupId}`);
    } catch (error) {
      this.logger.error(`Error deleting consumer group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Get consumer group offsets
   *
   * @param groupId - Consumer group ID
   */
  async getConsumerGroupOffsets(groupId: string): Promise<Array<ITopicPartitionOffsets>> {
    try {
      const admin = this.kafkaService.getAdmin();
      const offsets = await admin.fetchOffsets({
        groupId,
      });

      return offsets;
    } catch (error) {
      this.logger.error(`Error getting offsets for group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Reset consumer group offsets
   *
   * @param groupId - Consumer group ID
   * @param topic - Topic name
   * @param partitions - Partitions to reset (empty for all)
   */
  async resetConsumerGroupOffsets(
    groupId: string,
    topic: string,
    partitions?: number[],
  ): Promise<void> {
    try {
      const admin = this.kafkaService.getAdmin();

      // Get topic metadata to determine partitions if not specified
      if (!partitions) {
        const metadata = await admin.fetchTopicMetadata({ topics: [topic] });
        const topicMetadata = metadata.topics.find((t) => t.name === topic);
        partitions = topicMetadata?.partitions.map((p) => p.partitionId) || [];
      }

      // Reset offsets to earliest
      await admin.setOffsets({
        groupId,
        topic,
        partitions: partitions.map((partition) => ({
          partition,
          offset: '0', // Reset to beginning
        })),
      });

      this.logger.log(`Offsets reset for group ${groupId}, topic ${topic}`);
    } catch (error) {
      this.logger.error(
        `Error resetting offsets for group ${groupId}, topic ${topic}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get cluster information
   */
  async getClusterInfo(): Promise<any> {
    try {
      const admin = this.kafkaService.getAdmin();
      const cluster = await admin.describeCluster();

      return {
        brokers: cluster.brokers,
        controller: cluster.controller,
        clusterId: cluster.clusterId,
      };
    } catch (error) {
      this.logger.error('Error getting cluster info:', error);
      throw error;
    }
  }

  /**
   * Check if topic exists
   *
   * @param topic - Topic name
   */
  async topicExists(topic: string): Promise<boolean> {
    try {
      const topics = await this.listTopics();
      return topics.includes(topic);
    } catch (error) {
      this.logger.error(`Error checking if topic exists: ${topic}`, error);
      return false;
    }
  }

  /**
   * Ensure topic exists (create if it doesn't)
   *
   * @param options - Topic creation options
   */
  async ensureTopicExists(options: CreateTopicOptions): Promise<void> {
    try {
      const exists = await this.topicExists(options.topic);

      if (!exists) {
        await this.createTopic(options);
        this.logger.log(`Topic ensured: ${options.topic}`);
      } else {
        this.logger.debug(`Topic already exists: ${options.topic}`);
      }
    } catch (error) {
      this.logger.error(`Error ensuring topic exists: ${options.topic}`, error);
      throw error;
    }
  }
}
