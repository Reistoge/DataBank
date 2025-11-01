 import { RepositoryService } from "src/repository/repository.service";
import { TransactionDocument } from "src/transaction/schemas/transaction.schema";
import { SuspiciousBehaviour } from "../dto/fraud.dto";
import { TransactionValidation } from "./transaction-validation";
import { LowAmountValidation } from "./validations";
import { Neo4jService } from "src/database/neo4j/neo4j.service";

export class TransactionValidator {
    v: TransactionValidation[];
    constructor(
        neo4jService: Neo4jService,
        repositoryService: RepositoryService
    ) {
        this.v = []
        this.v.push(new LowAmountValidation(neo4jService, repositoryService));

    };
    async runAll(tx: TransactionDocument): Promise<SuspiciousBehaviour[]> {
        const results = await Promise.all(this.v.map(s => s.validate(tx)));
        return results.flat();
    }


}