// backend-data-bank/src/fraud-system/fraud-system.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Transaction, TransactionDocument } from 'src/transaction/schemas/transaction.schema';
import { FraudResult, LowAmount, SuspiciousBehaviour, SuspiciousBehaviourAnalyzer } from './dto/fraud.dto';
import { Neo4jService } from 'src/database/neo4j/neo4j.service';
import { CreateInvalidTransactionNode, CreateTransactionNode } from './queries/cypher-query';
import { TransactionValidator } from './validator/transaction-validator';
import { Document } from 'mongoose';

@Injectable()
export class FraudSystemService {
    updateUserSuspiciousBehaviour(pendingTx: TransactionDocument) {

    }
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

            this.logger.log(`validations finished, tx behaviours: ${JSON.stringify(behaviours)}`);
            const riskScore = SuspiciousBehaviourAnalyzer.calculateRiskScore(behaviours);
            const reccomendation = SuspiciousBehaviourAnalyzer.getRecommendation(riskScore);

            const isFraud = reccomendation === 'BLOCK' ? true : false;
            return {
                isFraud,
                probabilitySuspicious: riskScore,
                behaviours: behaviours,
                recommendation: reccomendation
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
            this.logger.log(` query result: ${result}`);
            return result;
        } catch (err) {
            this.logger.error(`Error creating transaction node:`, err);
            throw err;

        }
    }
    async createInvalidTransactionNode(txDocument: TransactionDocument) {
        try {
            const query = new CreateInvalidTransactionNode(this.neo4jService, txDocument);
            const result = await query.execute();

            this.logger.log(`Transaction node created: ${txDocument._id}`);
            return result;
        } catch (err) {
            this.logger.error(`Error creating transaction node:`, err);
            throw err;

        }

    }
}