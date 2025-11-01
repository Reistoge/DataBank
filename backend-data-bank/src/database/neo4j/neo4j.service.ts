import { Injectable, Logger } from '@nestjs/common';
import { Session } from 'inspector';
 
import { Neo4jService as Neo4jLibService, Neo4jConnection, Result } from 'nest-neo4j';
@Injectable()
export class Neo4jService {
  private readonly logger = new Logger(Neo4jService.name);

  constructor(private readonly neo4jService: Neo4jLibService) {
    this.logger.log('Neo4j service injected from nest-neo4j');
  }

  getConfig(): Neo4jConnection {
    return this.neo4jService.getConfig();
  }

 
  async read(query: string, params?: object, database?: string): Promise<Result> {
    try {
       return await this.neo4jService.read(query, params);
    } catch (error) {
      this.logger.error(`Neo4j read query error: ${error}`);
      throw error;
    }
  }

  async query(query: string, params?: object, database?: string): Promise<Result> {
    try {
       return await this.neo4jService.write(query, params);
    } catch (error) {
      this.logger.error(`Neo4j write query error: ${error}`);
      throw error;
    }
  }
  
}
