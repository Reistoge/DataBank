 import { RepositoryService } from "src/repository/repository.service";
import { TransactionDocument } from "src/transaction/schemas/transaction.schema";
import { SuspiciousBehaviour } from "../dto/fraud.dto";
import { CypherQuery } from "../queries/cypher-query";
import { Neo4jService } from "src/database/neo4j/neo4j.service";

export abstract class TransactionValidation {
    protected q: CypherQuery<TransactionDocument>[]
    neo4jService: Neo4jService;
    repositoryService: RepositoryService;
    tx: TransactionDocument;
    constructor(
        neo4jService: Neo4jService,
        repositoryService: RepositoryService
    ) {
        this.neo4jService = neo4jService;
        this.repositoryService = repositoryService;


    };
    abstract validate(tx: TransactionDocument): Promise<SuspiciousBehaviour[]>;

}

