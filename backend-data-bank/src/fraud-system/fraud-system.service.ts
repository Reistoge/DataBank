// backend-data-bank/src/fraud-system/fraud-system.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Transaction, TransactionDocument } from 'src/transaction/schemas/transaction.schema';
import { FraudResult, LowAmount, SuspiciousBehaviour } from './dto/fraud.dto';
import { Neo4jService } from 'src/database/neo4j/neo4j.service';
import { CreateTransactionNode } from './queries/cypher-query';
 import { TransactionValidator } from './validator/transaction-validator';

@Injectable()
export class FraudSystemService {
    private readonly logger = new Logger(FraudSystemService.name);

    constructor(
        private neo4jService: Neo4jService,
        // private repositoryService: RepositoryService, // REMOVE THIS
        private validator: TransactionValidator // This will be injected by Nest
    ) {
        // REMOVE THIS LINE ENTIRELY
        // this.validator = new TransactionValidator(this.neo4jService, this.repositoryService);
    }

    async validate(txDocument: TransactionDocument): Promise<FraudResult> {
        try {
            // This line now uses the injected validator instance
            const behaviours: SuspiciousBehaviour[] = await this.validator.runAll(txDocument);

            const isFraud = behaviours.length >= 5;
            const sum = behaviours.length > 0 ? behaviours.map((a: SuspiciousBehaviour) => a.weight).reduce((a: number, b: number) => ((a + b))) : 0;

            return {
                isFraud,
                predictionOutput: {
                    prediction: isFraud ? 1 : 0,
                    probability_suspicious: sum,
                    transaction_id: parseInt(txDocument.id.toString().slice(0, 8), 16),

                },
                cause: behaviours
            };
        } catch (err) {
            this.logger.error('Fraud validation error:', err);
            throw err instanceof Error ? err : new Error('Fraud validation failed');
        }
    }

    async createTransactionNode(txDocument: TransactionDocument) {
        try {
            const query = new CreateTransactionNode(this.neo4jService, txDocument);
            const result = await query.execute();

            this.logger.log(`Transaction node created: ${txDocument._id}`);
            return result;
        } catch (err) {
            this.logger.error(`Error creating transaction node:`, err);
            throw err;
            
        }
    }
}