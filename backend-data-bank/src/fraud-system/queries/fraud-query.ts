import { TransactionRequestDto } from "src/transaction/dto/transaction.dto";
import { SuspiciousBehaviour } from "../dto/fraud.dto";
import { CypherQuery } from "./cypher-query";
import { Neo4jService } from "src/database/neo4j/neo4j.service";
import { TransactionDocument } from "src/transaction/schemas/transaction.schema";
import { Model } from "mongoose";

// export class FraudQueryData {
//     transactionDto: TransactionRequestDto
//     senderId: string
//     receiverId: string
// }
// export interface IFraudQuery {
//     validate(): SuspiciousBehaviour[];
// }
// export class FraudQueryValidator {
//     constructor(private strategies: FraudQuery[]) { }

//     async runAll(): Promise<SuspiciousBehaviour[]> {
//         const results = await Promise.all(this.strategies.map(s => s.run()));
//         return results.flat();
//     }
// }

// export abstract class FraudQuery extends CypherQuery<FraudQueryData> implements IFraudQuery {
//     abstract validate(): SuspiciousBehaviour[];
//     async run(): Promise<SuspiciousBehaviour[]> {
//         await this.execute();
//         return this.validate();
//     }
// }
