import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService as Neo4jLibService } from 'nest-neo4j';

@Injectable()
export class Neo4jService {
  private readonly logger = new Logger(Neo4jService.name);

  constructor(private readonly neo4jService: Neo4jLibService) {
    this.logger.log('Neo4j service injected from nest-neo4j');
  }

  getConfig() {
    return this.neo4jService.getConfig();
  }

  async query(cypher: string, params: Record<string, any> = {}) {
    try {
      this.logger.log(`Executing query: ${cypher}`);

      const result = await this.neo4jService.write(cypher, params);
      return result.records;
    } catch (error) {
      this.logger.error(`Neo4j query error: ${error.message}`);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.query('RETURN 1 as test');
      this.logger.log('Neo4j connection test successful');
      return true;
    } catch (error) {
      this.logger.error('Neo4j connection test failed:', error.message);
      return false;
    }
  }
}
