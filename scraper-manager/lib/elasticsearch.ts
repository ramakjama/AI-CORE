import { Client } from '@elastic/elasticsearch';

const getElasticsearchConfig = () => {
  return {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    auth: process.env.ELASTICSEARCH_USERNAME
      ? {
          username: process.env.ELASTICSEARCH_USERNAME,
          password: process.env.ELASTICSEARCH_PASSWORD || '',
        }
      : undefined,
  };
};

class ElasticsearchClient {
  private static instance: Client | null = null;

  static getInstance(): Client {
    if (!ElasticsearchClient.instance) {
      ElasticsearchClient.instance = new Client(getElasticsearchConfig());
    }
    return ElasticsearchClient.instance;
  }
}

export const elasticsearch = ElasticsearchClient.getInstance();

// Search helpers
export class Search {
  static async indexDocument(index: string, id: string, document: any): Promise<void> {
    try {
      await elasticsearch.index({
        index,
        id,
        document,
      });
    } catch (error) {
      console.error('Error indexing document:', error);
      throw error;
    }
  }

  static async search<T>(index: string, query: any): Promise<T[]> {
    try {
      const result = await elasticsearch.search({
        index,
        body: query,
      });

      return result.hits.hits.map((hit: any) => ({
        ...hit._source,
        _id: hit._id,
        _score: hit._score,
      })) as T[];
    } catch (error) {
      console.error('Error searching:', error);
      return [];
    }
  }

  static async deleteDocument(index: string, id: string): Promise<void> {
    try {
      await elasticsearch.delete({
        index,
        id,
      });
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  }

  static async bulkIndex(index: string, documents: Array<{ id: string; document: any }>): Promise<void> {
    try {
      const body = documents.flatMap(({ id, document }) => [
        { index: { _index: index, _id: id } },
        document,
      ]);

      await elasticsearch.bulk({ body });
    } catch (error) {
      console.error('Error bulk indexing:', error);
      throw error;
    }
  }

  static async createIndex(index: string, mappings?: any): Promise<void> {
    try {
      const exists = await elasticsearch.indices.exists({ index });

      if (!exists) {
        await elasticsearch.indices.create({
          index,
          body: {
            mappings: mappings || {},
          },
        });
      }
    } catch (error) {
      console.error('Error creating index:', error);
      throw error;
    }
  }
}

export default elasticsearch;
